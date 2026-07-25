from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

class GeoBatchRequest(BaseModel):
    ips: List[str]

# Prediction
class FlowFeatures(BaseModel):
    """Single network flow feature vector for prediction."""
    dst_port: float
    protocol: float
    flow_duration: float
    tot_fwd_pkts: float
    tot_bwd_pkts: float
    totlen_fwd_pkts: float
    totlen_bwd_pkts: float
    fwd_pkt_len_max: float
    fwd_pkt_len_min: float
    fwd_pkt_len_mean: float
    fwd_pkt_len_std: float
    bwd_pkt_len_max: float
    bwd_pkt_len_min: float
    bwd_pkt_len_mean: float
    bwd_pkt_len_std: float
    flow_byts_s: float
    flow_pkts_s: float
    flow_iat_mean: float
    flow_iat_std: float
    flow_iat_max: float
    flow_iat_min: float
    fwd_iat_tot: float
    fwd_iat_mean: float
    fwd_iat_std: float
    fwd_iat_max: float
    fwd_iat_min: float
    bwd_iat_tot: float
    bwd_iat_mean: float
    bwd_iat_std: float
    bwd_iat_max: float
    bwd_iat_min: float
    fwd_psh_flags: float
    bwd_psh_flags: float
    fwd_urg_flags: float
    bwd_urg_flags: float
    fwd_header_len: float
    bwd_header_len: float
    fwd_pkts_s: float
    bwd_pkts_s: float
    pkt_len_min: float
    pkt_len_max: float
    pkt_len_mean: float
    pkt_len_std: float
    pkt_len_var: float
    fin_flag_cnt: float
    syn_flag_cnt: float
    rst_flag_cnt: float
    psh_flag_cnt: float
    ack_flag_cnt: float
    urg_flag_cnt: float
    cwe_flag_count: float
    ece_flag_cnt: float
    down_up_ratio: float
    pkt_size_avg: float
    fwd_seg_size_avg: float
    bwd_seg_size_avg: float
    fwd_byts_b_avg: float
    fwd_pkts_b_avg: float
    fwd_blk_rate_avg: float
    bwd_byts_b_avg: float
    bwd_pkts_b_avg: float
    bwd_blk_rate_avg: float
    subflow_fwd_pkts: float
    subflow_fwd_byts: float
    subflow_bwd_pkts: float
    subflow_bwd_byts: float
    init_fwd_win_byts: float
    init_bwd_win_byts: float
    fwd_act_data_pkts: float
    fwd_seg_size_min: float
    active_mean: float
    active_std: float
    active_max: float
    active_min: float
    idle_mean: float
    idle_std: float
    idle_max: float
    idle_min: float

class PredictionResult(BaseModel):
    label: str
    confidence: float
    is_attack: bool
    timestamp: datetime
    src_ip: Optional[str] = None
    dst_ip: Optional[str] = None
    src_port: Optional[int] = None
    dst_port_info: Optional[int] = None
    protocol: Optional[str] = None

class LivePredictionPayload(BaseModel):
    features: FlowFeatures
    src_ip: Optional[str] = None
    dst_ip: Optional[str] = None
    src_port: Optional[int] = None
    dst_port_info: Optional[int] = None
    protocol: Optional[str] = None

class BatchPredictionRequest(BaseModel):
    flows: List[FlowFeatures]

# Dashboard stats
class DashboardStats(BaseModel):
    total_flows: int
    total_attacks: int
    total_benign: int
    attack_rate: float
    top_attacks: List[dict]
    recent_alerts: List[dict]