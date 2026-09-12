# Contributing to LRIDS

Thank you for your interest in contributing to the **AI-Powered Landslide Risk Intelligence & Early Warning System (LRIDS)**.

## Code of Conduct
We adhere to scientific rigor, data integrity, and disaster-response reliability. All contributions must maintain high code quality and zero regressions across automated test suites.

## Development Workflow
1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Implement your changes adhering to Google-style docstrings (Python) and TSDoc (TypeScript).
3. Ensure all tests pass:
   ```bash
   cd backend && python -m pytest tests/ -v
   cd ../frontend && cmd /c "npm run build"
   ```
4. Submit a Pull Request with a clear description of your changes, geotechnical rationale, and verification results.

## Commit Message Convention
Use Conventional Commits:
- `feat(pipeline)`: New feature or data tier
- `fix(geotech)`: Bug fix in limit equilibrium calculation
- `docs(catalog)`: Documentation updates
- `test(api)`: Test suite additions\n