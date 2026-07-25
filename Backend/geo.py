import ipaddress
import logging
from functools import lru_cache
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)

FIELDS = "status,message,country,countryCode,regionName,city,lat,lon,query"


def is_private_ip(ip: Optional[str]) -> bool:
    if not ip:
        return True
    try:
        addr = ipaddress.ip_address(ip.strip())
        return addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved
    except ValueError:
        return True


@lru_cache(maxsize=1024)
def lookup_ip(ip: str) -> Dict[str, Any]:
    ip = (ip or "").strip()
    if not ip or is_private_ip(ip):
        return {
            "ip": ip or "unknown",
            "country": None,
            "country_code": None,
            "region": None,
            "city": None,
            "lat": None,
            "lon": None,
            "is_private": True,
            "label": "Local / Private",
        }

    try:
        resp = requests.get(
            f"http://ip-api.com/json/{ip}",
            params={"fields": FIELDS},
            timeout=4,
        )
        data = resp.json()
        if data.get("status") == "success":
            city = data.get("city") or ""
            country = data.get("country") or ""
            label = ", ".join(p for p in [city, country] if p) or country or "Unknown"
            return {
                "ip": ip,
                "country": country,
                "country_code": data.get("countryCode"),
                "region": data.get("regionName"),
                "city": city,
                "lat": data.get("lat"),
                "lon": data.get("lon"),
                "is_private": False,
                "label": label,
            }
    except Exception as exc:
        logger.warning("Geo lookup failed for %s: %s", ip, exc)

    return {
        "ip": ip,
        "country": None,
        "country_code": None,
        "region": None,
        "city": None,
        "lat": None,
        "lon": None,
        "is_private": False,
        "label": "Unknown",
    }


def lookup_ips(ips: list[str], limit: int = 150) -> Dict[str, Dict[str, Any]]:
    unique = []
    seen = set()
    for ip in ips:
        if not ip or ip in seen:
            continue
        seen.add(ip)
        unique.append(ip)
        if len(unique) >= limit:
            break
    return {ip: lookup_ip(ip) for ip in unique}
