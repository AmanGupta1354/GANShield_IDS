"""
pcap_to_csv.py — Pure-Python PCAP → CICFlowMeter-compatible CSV
Uses Scapy's PcapReader directly (no tcpdump needed on Windows).
"""

import csv
import statistics
from pathlib import Path

from scapy.all import PcapReader, IP, IPv6, TCP, UDP

FLOW_TIMEOUT_US  = 120_000_000   # 120 s
ACTIVE_TIMEOUT_US =  5_000_000   #   5 s

CSV_COLUMNS = [
    "Src IP","Dst IP","Src Port","Dst Port","Protocol",
    "Flow Duration","Tot Fwd Pkts","Tot Bwd Pkts",
    "TotLen Fwd Pkts","TotLen Bwd Pkts",
    "Fwd Pkt Len Max","Fwd Pkt Len Min","Fwd Pkt Len Mean","Fwd Pkt Len Std",
    "Bwd Pkt Len Max","Bwd Pkt Len Min","Bwd Pkt Len Mean","Bwd Pkt Len Std",
    "Flow Byts/s","Flow Pkts/s",
    "Flow IAT Mean","Flow IAT Std","Flow IAT Max","Flow IAT Min",
    "Fwd IAT Tot","Fwd IAT Mean","Fwd IAT Std","Fwd IAT Max","Fwd IAT Min",
    "Bwd IAT Tot","Bwd IAT Mean","Bwd IAT Std","Bwd IAT Max","Bwd IAT Min",
    "Fwd PSH Flags","Bwd PSH Flags","Fwd URG Flags","Bwd URG Flags",
    "Fwd Header Len","Bwd Header Len","Fwd Pkts/s","Bwd Pkts/s",
    "Pkt Len Min","Pkt Len Max","Pkt Len Mean","Pkt Len Std","Pkt Len Var",
    "FIN Flag Cnt","SYN Flag Cnt","RST Flag Cnt","PSH Flag Cnt",
    "ACK Flag Cnt","URG Flag Cnt","CWE Flag Count","ECE Flag Cnt",
    "Down/Up Ratio","Pkt Size Avg","Fwd Seg Size Avg","Bwd Seg Size Avg",
    "Fwd Byts/b Avg","Fwd Pkts/b Avg","Fwd Blk Rate Avg",
    "Bwd Byts/b Avg","Bwd Pkts/b Avg","Bwd Blk Rate Avg",
    "Subflow Fwd Pkts","Subflow Fwd Byts","Subflow Bwd Pkts","Subflow Bwd Byts",
    "Init Fwd Win Byts","Init Bwd Win Byts",
    "Fwd Act Data Pkts","Fwd Seg Size Min",
    "Active Mean","Active Std","Active Max","Active Min",
    "Idle Mean","Idle Std","Idle Max","Idle Min",
]

def _mean(v):  return statistics.mean(v) if v else 0.0
def _std(v):   return statistics.stdev(v) if len(v) > 1 else 0.0
def _iats(ts): return [ts[i+1]-ts[i] for i in range(len(ts)-1)] if len(ts)>1 else []

def _new_flow(sip, dip, sp, dp, proto):
    return dict(
        src_ip=sip, dst_ip=dip, src_port=sp, dst_port=dp, proto=proto,
        fwd_lens=[], bwd_lens=[], fwd_ts=[], bwd_ts=[], all_ts=[],
        fwd_hdrs=[], bwd_hdrs=[],
        fwd_psh=0, bwd_psh=0, fwd_urg=0, bwd_urg=0,
        fin=0, syn=0, rst=0, psh=0, ack=0, urg=0, cwe=0, ece=0,
        fwd_win=-1, bwd_win=-1, fwd_act_data=0, last_ts=0,
    )

def _update(fd, is_fwd, plen, payload, hdr, flags, win, ts):
    fd["last_ts"] = ts
    fd["all_ts"].append(ts)
    if flags & 0x01: fd["fin"] += 1
    if flags & 0x02: fd["syn"] += 1
    if flags & 0x04: fd["rst"] += 1
    if flags & 0x08: fd["psh"] += 1
    if flags & 0x10: fd["ack"] += 1
    if flags & 0x20: fd["urg"] += 1
    if flags & 0x40: fd["ece"] += 1
    if flags & 0x80: fd["cwe"] += 1
    if is_fwd:
        fd["fwd_lens"].append(plen); fd["fwd_ts"].append(ts); fd["fwd_hdrs"].append(hdr)
        if flags & 0x08: fd["fwd_psh"] = 1
        if flags & 0x20: fd["fwd_urg"] = 1
        if win and fd["fwd_win"] == -1: fd["fwd_win"] = win
        if payload > 0: fd["fwd_act_data"] += 1
    else:
        fd["bwd_lens"].append(plen); fd["bwd_ts"].append(ts); fd["bwd_hdrs"].append(hdr)
        if flags & 0x08: fd["bwd_psh"] = 1
        if flags & 0x20: fd["bwd_urg"] = 1
        if win and fd["bwd_win"] == -1: fd["bwd_win"] = win

def _active_idle(ts_list):
    if len(ts_list) < 2: return [], []
    s = sorted(ts_list); active=[]; idle=[]; start=s[0]; prev=s[0]
    for t in s[1:]:
        gap = t - prev
        if gap > ACTIVE_TIMEOUT_US: active.append(prev-start); idle.append(gap); start=t
        prev = t
    active.append(prev - start)
    return active, idle

def _to_row(key, fd):
    fw, bw = fd["fwd_lens"], fd["bwd_lens"]
    if not fw and not bw: return None
    all_ts = sorted(fd["all_ts"])
    dur = (all_ts[-1]-all_ts[0]) if len(all_ts)>1 else 0
    dur_s = dur / 1_000_000
    all_lens = fw + bw
    fwd_iats = _iats(sorted(fd["fwd_ts"])); bwd_iats = _iats(sorted(fd["bwd_ts"]))
    flow_iats = _iats(all_ts)
    act, idl = _active_idle(all_ts)
    sip, dip, sp, dp, proto = key
    return {
        "Src IP": sip, "Dst IP": dip, "Src Port": sp, "Dst Port": dp, "Protocol": proto,
        "Flow Duration": dur,
        "Tot Fwd Pkts": len(fw), "Tot Bwd Pkts": len(bw),
        "TotLen Fwd Pkts": sum(fw), "TotLen Bwd Pkts": sum(bw),
        "Fwd Pkt Len Max": max(fw,default=0), "Fwd Pkt Len Min": min(fw,default=0),
        "Fwd Pkt Len Mean": round(_mean(fw),6), "Fwd Pkt Len Std": round(_std(fw),6),
        "Bwd Pkt Len Max": max(bw,default=0), "Bwd Pkt Len Min": min(bw,default=0),
        "Bwd Pkt Len Mean": round(_mean(bw),6), "Bwd Pkt Len Std": round(_std(bw),6),
        "Flow Byts/s": round(sum(all_lens)/dur_s,6) if dur_s else 0,
        "Flow Pkts/s": round(len(all_lens)/dur_s,6) if dur_s else 0,
        "Flow IAT Mean": round(_mean(flow_iats),6), "Flow IAT Std": round(_std(flow_iats),6),
        "Flow IAT Max": max(flow_iats,default=0), "Flow IAT Min": min(flow_iats,default=0),
        "Fwd IAT Tot": sum(fwd_iats), "Fwd IAT Mean": round(_mean(fwd_iats),6),
        "Fwd IAT Std": round(_std(fwd_iats),6),
        "Fwd IAT Max": max(fwd_iats,default=0), "Fwd IAT Min": min(fwd_iats,default=0),
        "Bwd IAT Tot": sum(bwd_iats), "Bwd IAT Mean": round(_mean(bwd_iats),6),
        "Bwd IAT Std": round(_std(bwd_iats),6),
        "Bwd IAT Max": max(bwd_iats,default=0), "Bwd IAT Min": min(bwd_iats,default=0),
        "Fwd PSH Flags": fd["fwd_psh"], "Bwd PSH Flags": fd["bwd_psh"],
        "Fwd URG Flags": fd["fwd_urg"], "Bwd URG Flags": fd["bwd_urg"],
        "Fwd Header Len": sum(fd["fwd_hdrs"]), "Bwd Header Len": sum(fd["bwd_hdrs"]),
        "Fwd Pkts/s": round(len(fw)/dur_s,6) if dur_s else 0,
        "Bwd Pkts/s": round(len(bw)/dur_s,6) if dur_s else 0,
        "Pkt Len Min": min(all_lens,default=0), "Pkt Len Max": max(all_lens,default=0),
        "Pkt Len Mean": round(_mean(all_lens),6), "Pkt Len Std": round(_std(all_lens),6),
        "Pkt Len Var": round(_std(all_lens)**2,6),
        "FIN Flag Cnt": fd["fin"], "SYN Flag Cnt": fd["syn"],
        "RST Flag Cnt": fd["rst"], "PSH Flag Cnt": fd["psh"],
        "ACK Flag Cnt": fd["ack"], "URG Flag Cnt": fd["urg"],
        "CWE Flag Count": fd["cwe"], "ECE Flag Cnt": fd["ece"],
        "Down/Up Ratio": round(len(bw)/len(fw),6) if fw else 0,
        "Pkt Size Avg": round(_mean(all_lens),6),
        "Fwd Seg Size Avg": round(_mean(fw),6), "Bwd Seg Size Avg": round(_mean(bw),6),
        "Fwd Byts/b Avg": 0, "Fwd Pkts/b Avg": 0, "Fwd Blk Rate Avg": 0,
        "Bwd Byts/b Avg": 0, "Bwd Pkts/b Avg": 0, "Bwd Blk Rate Avg": 0,
        "Subflow Fwd Pkts": len(fw), "Subflow Fwd Byts": sum(fw),
        "Subflow Bwd Pkts": len(bw), "Subflow Bwd Byts": sum(bw),
        "Init Fwd Win Byts": fd["fwd_win"] if fd["fwd_win"]!=-1 else 0,
        "Init Bwd Win Byts": fd["bwd_win"] if fd["bwd_win"]!=-1 else 0,
        "Fwd Act Data Pkts": fd["fwd_act_data"],
        "Fwd Seg Size Min": min(fw,default=0),
        "Active Mean": round(_mean(act),6), "Active Std": round(_std(act),6),
        "Active Max": max(act,default=0), "Active Min": min(act,default=0),
        "Idle Mean": round(_mean(idl),6), "Idle Std": round(_std(idl),6),
        "Idle Max": max(idl,default=0), "Idle Min": min(idl,default=0),
    }

def pcap_to_csv(pcap_path: str, csv_path: str) -> int:
    flows = {}
    with PcapReader(str(pcap_path)) as reader:
        for pkt in reader:
            if IP in pkt:
                ip = pkt[IP]; sip, dip = ip.src, ip.dst; proto = ip.proto; ih = ip.ihl*4
            elif IPv6 in pkt:
                ip = pkt[IPv6]; sip, dip = ip.src, ip.dst; proto = ip.nh; ih = 40
            else:
                continue
            sp = dp = flags = win = payload = th = uh = 0
            if TCP in pkt:
                t = pkt[TCP]; sp,dp = t.sport,t.dport
                flags = int(t.flags); win = t.window
                th = (t.dataofs or 5)*4; payload = len(t.payload)
            elif UDP in pkt:
                u = pkt[UDP]; sp,dp = u.sport,u.dport; uh = 8; payload = len(u.payload)
            plen = len(pkt)
            ts = int(float(pkt.time)*1_000_000)
            fk = (sip, dip, sp, dp, proto)
            bk = (dip, sip, dp, sp, proto)
            if fk in flows:   key, is_fwd = fk, True
            elif bk in flows: key, is_fwd = bk, False
            else:             key, is_fwd = fk, True; flows[key] = _new_flow(*key)
            fd = flows[key]
            if ts - fd["last_ts"] > FLOW_TIMEOUT_US:
                flows[key] = _new_flow(*key); fd = flows[key]; is_fwd = True
            _update(fd, is_fwd, plen, payload, ih+th+uh, flags, win, ts)

    rows = [r for r in (_to_row(k,v) for k,v in flows.items()) if r]
    Path(csv_path).parent.mkdir(parents=True, exist_ok=True)
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        w.writeheader(); w.writerows(rows)
    return len(rows)
