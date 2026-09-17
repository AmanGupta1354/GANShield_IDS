import threading
import os
import time
from pathlib import Path
from datetime import datetime
from scapy.all import sniff, wrpcap, IFACES
from config import settings
import logging

logger = logging.getLogger(__name__)


def resolve_interface(iface: str) -> str:
    """Map GUID / friendly name to a Scapy/Npcap adapter name Windows can open."""
    if not iface:
        iface = settings.CAPTURE_INTERFACE

    # Dashboard dropdown may send "WiFi 2 (192.168.1.3)"
    iface = iface.split(" (")[0].strip()
    if iface in IFACES:
        info = IFACES[iface]
        return getattr(info, "network_name", None) or getattr(info, "name", None) or iface

    for key, info in IFACES.items():
        if info.name == iface or str(key) == iface:
            return getattr(info, "network_name", None) or info.name or iface

    return iface


class PacketCapture:
    """
    Captures live packets from a NIC using Scapy, scoped to the ports this
    application listens on via a BPF filter (settings.CAPTURE_BPF_FILTER) —
    i.e. it monitors traffic entering/leaving THIS app, not the whole NIC.
    Dumps PCAP files every `interval` seconds so the flow extractor can
    process them.

    Why not flush more often?  A flow row is only produced once the flow is
    COMPLETE (TCP FIN/RST seen, or timeout). Flushing too often means most
    flows are still open when the PCAP is written -> 0 rows extracted.
    ~10s is a reasonable balance for short-lived HTTP flows; tune via
    settings.PCAP_FLUSH_INTERVAL_S if flows are being cut short.
    """

    def __init__(self, interface: str = None, interval: int = None, bpf_filter: str = None):
        self.interface = interface or settings.CAPTURE_INTERFACE
        self.interval = interval or settings.PCAP_FLUSH_INTERVAL_S
        self.bpf_filter = bpf_filter or settings.CAPTURE_BPF_FILTER
        self.running = False
        self.thread: threading.Thread = None
        self.packets = []
        self.lock = threading.Lock()
        self._consecutive_errors = 0
        Path(settings.CAPTURE_PCAP_DIR).mkdir(parents=True, exist_ok=True)

    def _packet_handler(self, pkt):
        with self.lock:
            self.packets.append(pkt)

    def _flush_pcap(self):
        """Write captured packets to PCAP file and clear buffer."""
        with self.lock:
            if not self.packets:
                return None
            pkts = list(self.packets)
            self.packets.clear()

        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        pcap_path = os.path.join(settings.CAPTURE_PCAP_DIR, f"capture_{ts}.pcap")
        wrpcap(pcap_path, pkts)
        logger.info(f"PCAP saved: {pcap_path} ({len(pkts)} packets)")
        return pcap_path

    def _capture_loop(self):
        while self.running:
            try:
                sniff(
                    iface=self.interface,
                    filter=self.bpf_filter,
                    prn=self._packet_handler,
                    store=False,
                    timeout=self.interval,
                    stop_filter=lambda p: not self.running,
                )
                self._consecutive_errors = 0
            except Exception:
                self._consecutive_errors += 1
                logger.exception(
                    "Packet capture error on interface %s (attempt %d)",
                    self.interface, self._consecutive_errors,
                )
                if self._consecutive_errors >= 5:
                    logger.error("Too many consecutive capture errors — stopping capture.")
                    self.running = False
                    break
                time.sleep(min(2 ** self._consecutive_errors, 30))
                continue
            self._flush_pcap()

    def start(self):
        if self.running:
            logger.warning("Packet capture already running.")
            return
        self.interface = resolve_interface(self.interface)
        self.running = True
        self._consecutive_errors = 0
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        logger.info(
            f"Packet capture started on interface: {self.interface} "
            f"| filter: '{self.bpf_filter}' | flush every {self.interval}s"
        )

    def stop(self):
        self.running = False
        logger.info("Packet capture stopped.")

    def is_running(self) -> bool:
        return self.running

    def get_interfaces(self) -> list:
        seen = set()
        result = []
        for info in IFACES.values():
            name = getattr(info, "name", None)
            ip = getattr(info, "ip", None)
            if not name or name in seen or name.startswith("\\Device"):
                continue
            if ip and ip != "0.0.0.0":
                result.append(f"{name} ({ip})")
                seen.add(name)
        return result


packet_capture = PacketCapture()