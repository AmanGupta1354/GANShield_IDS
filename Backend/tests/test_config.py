"""BPF filter should scope capture to the app's own port(s) — the core of
the traffic-source change (monitor the website, not the whole NIC)."""


def test_bpf_filter_single_port(monkeypatch):
    from config import settings
    monkeypatch.setattr(settings, "MONITORED_PORTS", [8000])
    assert settings.CAPTURE_BPF_FILTER == "tcp port 8000"


def test_bpf_filter_multiple_ports(monkeypatch):
    from config import settings
    monkeypatch.setattr(settings, "MONITORED_PORTS", [80, 443, 8000])
    assert settings.CAPTURE_BPF_FILTER == "tcp port 80 or tcp port 443 or tcp port 8000"


def test_bpf_filter_falls_back_to_app_port(monkeypatch):
    from config import settings
    monkeypatch.setattr(settings, "MONITORED_PORTS", [])
    monkeypatch.setattr(settings, "PORT", 9001)
    assert settings.CAPTURE_BPF_FILTER == "tcp port 9001"
