import tempfile
from pathlib import Path

from scapy.all import IP, TCP, wrpcap

from pcap_to_csv import pcap_to_flows


def _write_sample_pcap(path: str, port: int = 8000):
    """Two packets of a TCP handshake-ish exchange on `port`, plus one
    unrelated packet on a different port to test BPF-style filtering."""
    pkts = [
        IP(src="10.0.0.5", dst="10.0.0.1") / TCP(sport=51000, dport=port, flags="S", seq=0),
        IP(src="10.0.0.1", dst="10.0.0.5") / TCP(sport=port, dport=51000, flags="SA", seq=0, ack=1),
        IP(src="10.0.0.5", dst="10.0.0.9") / TCP(sport=51000, dport=9999, flags="S", seq=0),
    ]
    wrpcap(path, pkts)


def test_pcap_to_flows_extracts_rows():
    with tempfile.TemporaryDirectory() as d:
        pcap_path = str(Path(d) / "sample.pcap")
        _write_sample_pcap(pcap_path, port=8000)

        rows = pcap_to_flows(pcap_path)
        assert len(rows) == 2  # two distinct 5-tuples

        by_dst_port = {r["Dst Port"] for r in rows}
        assert 8000 in by_dst_port
        assert 9999 in by_dst_port


def test_pcap_to_flows_scopes_to_monitored_ports():
    """This is the mechanism behind 'monitor traffic entering the app':
    packets whose port isn't in bpf_ports are dropped even if they slipped
    into the PCAP."""
    with tempfile.TemporaryDirectory() as d:
        pcap_path = str(Path(d) / "sample.pcap")
        _write_sample_pcap(pcap_path, port=8000)

        rows = pcap_to_flows(pcap_path, bpf_ports=[8000])
        assert len(rows) == 1
        assert rows[0]["Dst Port"] == 8000
