# Development Guide

## Quick Start

### 1. Setup Development Environment

```bash
# Clone and navigate to the python-service directory
cd python-service

# Run the setup script (creates venv and installs dependencies)
python setup.py

# Or manually:
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
# Edit .env with your configuration
```

Key configuration variables:
- `GEMINI_API_KEY`: Your Google Gemini API key
- `GOOGLE_SHEETS_CREDENTIALS_JSON`: Google Sheets service account credentials
- `GOOGLE_SHEETS_SPREADSHEET_ID`: Target spreadsheet ID
- `REDIS_URL`: Redis connection URL (optional for development)

### 3. Run the Service

```bash
# Using the startup script
python start.py

# Or directly
python main.py

# Or with uvicorn for development
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The service will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Development Workflow

### Running Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_health.py

# Run with coverage
pytest --cov=app tests/
```

### Code Quality

```bash
# Format code
black .

# Sort imports
isort .

# Type checking
mypy .

# Linting
flake8 .
```

### Project Structure

```
python-service/
├── app/                    # Application package
│   ├── api/               # API routes and endpoints
│   │   └── v1/           # API version 1
│   │       ├── endpoints/ # Individual endpoint modules
│   │       └── api.py    # Router configuration
│   ├── core/             # Core application components
│   │   ├── config.py     # Configuration management
│   │   └── logging.py    # Logging setup
│   └── __init__.py
├── tests/                 # Test suite
├── main.py               # Application entry point
├── requirements.txt      # Python dependencies
├── pyproject.toml       # Project configuration
├── Dockerfile           # Container configuration
├── docker-compose.yml   # Multi-service setup
└── README.md            # Project documentation
```

## Docker Development

### Build and Run with Docker

```bash
# Build the image
docker build -t langgraph-ai-assistant .

# Run the container
docker run -p 8000:8000 --env-file .env langgraph-ai-assistant

# Or use docker-compose
docker-compose up --build
```

### Docker Compose Services

- `langgraph-service`: Main Python application
- `redis`: Redis cache (optional)

## API Documentation

### Health Endpoints

- `GET /health` - Basic health check
- `GET /api/v1/health/` - Detailed health with dependencies
- `GET /api/v1/health/detailed` - Comprehensive system info
- `GET /api/v1/health/readiness` - Kubernetes readiness probe
- `GET /api/v1/health/liveness` - Kubernetes liveness probe

### Adding New Endpoints

1. Create endpoint module in `app/api/v1/endpoints/`
2. Add router to `app/api/v1/api.py`
3. Add tests in `tests/`

Example:
```python
# app/api/v1/endpoints/example.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def example_endpoint():
    return {"message": "Hello World"}
```

```python
# app/api/v1/api.py
from .endpoints import example

api_router.include_router(example.router, prefix="/example", tags=["example"])
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `false` |
| `PORT` | Server port | `8000` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `["http://localhost:3000"]` |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `GOOGLE_SHEETS_CREDENTIALS_JSON` | Google Sheets credentials | - |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Target spreadsheet ID | - |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `SECRET_KEY` | Application secret key | - |

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure virtual environment is activated
2. **Port conflicts**: Change PORT in .env or stop conflicting services
3. **Dependency conflicts**: Delete venv and reinstall dependencies
4. **Google API errors**: Check credentials and API key configuration

### Debugging

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Run with Python debugger
python -m pdb main.py

# Check service health
curl http://localhost:8000/health
```

### Performance Monitoring

The service includes structured logging and health checks for monitoring:

- JSON-formatted logs with correlation IDs
- Prometheus-compatible metrics (future enhancement)
- Health check endpoints for load balancers
- Request/response timing information

## Next Steps

This foundation provides:
- ✅ FastAPI application structure
- ✅ Environment configuration management
- ✅ Health check endpoints
- ✅ Structured logging
- ✅ Docker containerization
- ✅ Test framework setup

Ready for implementing:
- LangGraph workflow engine
- Google Sheets integration
- AI service integration
- CRUD operations
- Authentication and authorization