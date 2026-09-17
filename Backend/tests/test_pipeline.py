from database import FlowLog


def test_row_to_payload_maps_columns_and_meta():
    from pipeline import row_to_payload

    row = {
        "Dst Port": "443", "Protocol": "6", "Flow Duration": "1000",
        "Tot Fwd Pkts": "3", "Src IP": "10.0.0.5", "Dst IP": "10.0.0.1",
        "Src Port": "51000",
    }
    payload = row_to_payload(row)

    assert payload["src_ip"] == "10.0.0.5"
    assert payload["dst_ip"] == "10.0.0.1"
    assert payload["src_port"] == 51000
    assert payload["features"]["dst_port"] == 443.0
    assert payload["features"]["tot_fwd_pkts"] == 3.0
    # meta keys never leak into the feature vector fed to the model
    assert "src_ip" not in payload["features"]


def test_row_to_payload_handles_missing_and_bad_values():
    from pipeline import row_to_payload

    row = {"Flow Duration": "not-a-number", "Flow Byts/s": "inf"}
    payload = row_to_payload(row)

    assert payload["features"]["flow_duration"] == 0.0
    assert payload["features"]["flow_byts_s"] == 0.0
    # columns absent from the row default to 0.0 rather than KeyError
    assert payload["features"]["tot_fwd_pkts"] == 0.0


def test_ingest_payloads_persists_and_returns_results(db_session, zero_features):
    from pipeline import pipeline

    payload = {"features": dict(zero_features), "src_ip": "1.2.3.4", "dst_ip": "5.6.7.8", "src_port": 1234}
    result = pipeline.ingest_payloads([payload], source="test")

    assert result["status"] == "success"
    assert result["processed"] == 1

    row = db_session.query(FlowLog).order_by(FlowLog.id.desc()).first()
    assert row is not None
    assert row.src_ip == "1.2.3.4"
    assert row.label  # predictor always returns some label


def test_ingest_payloads_empty_is_noop():
    from pipeline import pipeline

    assert pipeline.ingest_payloads([]) == {"status": "empty", "processed": 0}


def test_ingest_without_bound_loop_does_not_raise(zero_features):
    """pipeline.ingest_* must work even when nothing has called bind() yet
    (e.g. watcher.py's standalone backfill CLI) — broadcast is just skipped."""
    from pipeline import FlowIngestPipeline

    standalone = FlowIngestPipeline()
    payload = {"features": dict(zero_features)}
    result = standalone.ingest_payloads([payload], source="standalone")
    assert result["processed"] == 1
