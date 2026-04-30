FROM python:3.12-slim

WORKDIR /app

# Install required packages
RUN pip install --no-cache-dir Flask pandas scikit-learn numpy pyarrow

# Copy everything
COPY . .

# Train the model inside Docker (ensures compatibility)
RUN python train_model.py

EXPOSE 5000
ENV PORT=5000

CMD ["python", "app.py"]