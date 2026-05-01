# Cloud-Based ML Model Deployment for Course Recommendation System
## Student Course Registration System using IaaS, PaaS, SaaS

---

## 1. ABSTRACT
This project demonstrates end-to-end deployment of Machine Learning models using 
cloud computing services. A course recommendation system is built using TF-IDF and 
Cosine Similarity, deployed across IaaS (Docker/Kubernetes), PaaS (Render), and 
SaaS (Recommendation API).

## 2. DATASET
- Source: Coursera Course Dataset
- Records: 3,522 courses
- Features: Course Name, University, Difficulty Level, Rating, Description, Skills

## 3. ARCHITECTURE

### Service Models Demonstrated:
1. **SaaS** - ML Recommendation API endpoint
2. **PaaS** - Node.js frontend on Render platform
3. **IaaS** - Docker containers, Kubernetes orchestration

### Technology Stack:
- Backend: Python, Flask, Scikit-learn
- Frontend: Node.js, Express, EJS
- Container: Docker
- Orchestration: Kubernetes
- Automation: Ansible
- Cloud: Render/Railway

## 4. IMPLEMENTATION DETAILS

### 4.1 ML Model (Lab: Docker Deployment)
- Algorithm: TF-IDF Vectorization + Cosine Similarity
- Training: 3,522 courses processed
- API: Flask REST API with /recommend endpoint
- Containerized using Docker

### 4.2 Frontend Application (Lab: Node.js Deployment)
- E-commerce style course catalog
- AI-powered recommendations display
- Shopping cart and checkout functionality
- Microservices architecture

### 4.3 Kubernetes Monitoring (Lab: K8s Monitoring Stack)
- Deployment with 2 replicas
- NodePort service for external access
- Prometheus & Grafana integration

### 4.4 Ansible Automation (Lab: Infrastructure Automation)
- Automated Docker deployment
- Nginx reverse proxy configuration
- Infrastructure as Code

### 4.5 Cloud Deployment
- PaaS: Render platform for frontend
- IaaS: Docker containers for ML service
- SaaS: Recommendation API as service

## 5. API ENDPOINTS

### Health Check:
GET /health
Response: {"status":"healthy", "courses_count":3522}

### Recommendations:
GET /recommend?title=Machine Learning&num=5
Response: {
  "input_course": "Machine Learning",
  "recommendations": [
    {"title": "...", "similarity_score": 44.04, "difficulty": "Beginner"}
  ]
}

## 6. E-COMMERCE FEATURES
- Course catalog display
- Add to cart functionality
- Shopping cart management
- Checkout and order confirmation
- Order ID generation

## 7. KEY FEATURES IMPLEMENTED
✅ ML Model Training & Serving
✅ Docker Containerization
✅ Kubernetes Deployment Configuration
✅ Ansible Automation Playbook
✅ Node.js Frontend with EJS
✅ AI-Powered Recommendations
✅ Shopping Cart System
✅ Cloud Service Models (IaaS, PaaS, SaaS)
✅ Health Check Endpoints
✅ Error Handling

## 8. SCREENSHOTS
[Insert screenshots here:
1. ML API Health Check
2. Course Recommendations JSON
3. Course Catalog Page
4. AI Recommendations on Course Detail
5. Shopping Cart
6. Checkout Confirmation
7. Docker Container Running
8. Kubernetes Pods
9. Grafana Dashboard]

## 9. CONCLUSION
Successfully implemented and deployed a cloud-based ML recommendation system 
demonstrating all three cloud service models. The project integrates Docker 
containerization, Kubernetes orchestration, Ansible automation, and Node.js 
microservices architecture.

## 10. FUTURE ENHANCEMENTS
- Real-time recommendation updates
- User authentication
- Database integration
- CI/CD pipeline
- Load balancing    