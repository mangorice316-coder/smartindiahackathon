# Operational Troubleshooting Playbook

Standard recovery protocols for common runtime, network, and data edge cases.

---

## 1. Telemetry & Weather Failures

### Symptom: "Open-Meteo REST Stream Timeout"
* **Cause**: Remote mountain AWS network connectivity loss or third-party API rate limit.
* **Automatic Mitigation**: LRIDS automatically switches to the cached historical monsoon baseline for the affected sector without interrupting dashboard uptime.
* **Manual Remedy**:
  ```bash
  # Check backend connectivity:
  curl -I https://api.open-meteo.com/v1/forecast
  # Force re-synchronization via API:
  curl -X POST "http://localhost:8000/api/v1/sync-live"
  ```

---

## 2. Database & Locking Edge Cases

### Symptom: "sqlite3.OperationalError: database is locked"
* **Cause**: Concurrent multi-threaded write access during simultaneous telemetry ingestion and alert dispatching.
* **Remedy**:
  - The SQLite database is pre-configured with **WAL (Write-Ahead Logging)** mode.
  - Verify WAL status:
    ```sql
    PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=5000;
    ```

---

## 3. Frontend & Build Issues

### Symptom: "npm.ps1 cannot be loaded because running scripts is disabled on this system"
* **Cause**: Windows PowerShell execution policy restricts running unsanctioned scripts.
* **Remedy**: Run npm through the Windows Command Processor:
  ```cmd
  cmd /c "npm run build"
  cmd /c "npm run dev"
  ```

### Symptom: "Leaflet Map Tiles Blank / Grey"
* **Cause**: WebGL hardware acceleration disabled or offline network state.
* **Remedy**: Use the base-map selector in the top-left corner of `RiskMapCanvas` to toggle between **Dark Matter (CartoDB)**, **Satellite (ESRI)**, and **Terrain (OpenTopoMap)**.\n