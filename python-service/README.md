# LangGraph AI Assistant Service

Advanced AI assistant powered by LangGraph for fundraising intelligence platform.

## Features

- **LangGraph Workflows**: Multi-step reasoning and conversation state management
- **CRUD Operations**: Natural language data manipulation
- **FastAPI Framework**: High-performance async API
- **Health Monitoring**: Comprehensive health checks and monitoring
- **Structured Logging**: JSON-based logging with correlation IDs
- **Environment Configuration**: Flexible configuration management

## Quick Start

### Prerequisites

- Python 3.11 or higher
- pip or poetry for dependency management

### Installation

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the service:
```bash
python main.py
```

The service will be available at `http://localhost:8000`

### API Documentation

- Interactive API docs: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`

## Development

### Project Structure

```
python-service/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       └── api.py
│   ├── core/
│   │   ├── config.py
│   │   └── logging.py
│   └── __init__.py
├── main.py
├── requirements.txt
├── pyproject.toml
└── README.md
```

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black .
isort .
```

### Type Checking

```bash
mypy .
```

## Configuration

The service uses environment variables for configuration. See `.env.example` for available options.

Key configuration areas:
- **Application**: Debug mode, port, logging level
- **CORS**: Allowed origins for cross-origin requests
- **Google Services**: Sheets API credentials and spreadsheet ID
- **AI Services**: Gemini API key
- **Database**: Redis connection URL
- **Security**: Secret keys and token expiration

## Health Checks

The service provides multiple health check endpoints:

- `GET /health` - Basic health status
- `GET /api/v1/health/` - Detailed health with dependencies
- `GET /api/v1/health/detailed` - Comprehensive system information
- `GET /api/v1/health/readiness` - Kubernetes readiness probe
- `GET /api/v1/health/liveness` - Kubernetes liveness probe

## Deployment

The service is designed to be containerized and deployed in cloud environments. See the main project documentation for deployment instructions.