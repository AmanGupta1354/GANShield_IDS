import threading
import os
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
    Captures live packets from NIC using Scapy.
    Dumps PCAP files every `interval` seconds so CICFlowMeter can process them.

    Why 60s?  CICFlowMeter only outputs a flow row once the flow is COMPLETE
    (TCP FIN/RST seen, or flow timeout). With a 10-second window most flows
    are still open when the PCAP is flushed → cicflowmeter produces 0 rows.
    60 seconds gives the majority of short-lived flows time to finish.
    """

    def __init__(self, interface: str = None, interval: int = 10):
        self.interface = interface or settings.CAPTURE_INTERFACE
        self.interval = interval
        self.running = False
        self.thread: threading.Thread = None
        self.packets = []
        self.lock = threading.Lock()
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
            sniff(
                iface=self.interface,
                prn=self._packet_handler,
                store=False,
                timeout=self.interval,
                stop_filter=lambda p: not self.running,
            )
            self._flush_pcap()

    def start(self):
        if self.running:
            logger.warning("Packet capture already running.")
            return
        self.interface = resolve_interface(self.interface)
        self.running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        logger.info(
            f"Packet capture started on interface: {self.interface} "
            f"(flush every {self.interval}s)"
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