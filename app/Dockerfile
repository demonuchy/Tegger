FROM python:3.11

WORKDIR /app

COPY req.txt .

RUN pip install --no-cache-dir -r req.txt

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]