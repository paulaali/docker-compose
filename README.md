# DockerQuiz

DockerQuiz is a hands-on, Kahoot-style quiz app for learning Docker fundamentals by running a real multi-container application.

It uses Python, Flask, MongoDB, and Mongo Express, all wired together with Docker Compose. The goal is to help beginners move beyond isolated Docker commands and see how containers, networks, volumes, ports, and service discovery work in a real app.

## What You Will Learn

- How to run a 3-container application with Docker Compose
- How a Flask app connects to MongoDB inside a Docker network
- Why containers use service names like `mongo` instead of `localhost`
- How named volumes persist database data
- How to inspect app data visually with Mongo Express
- How to rebuild, stop, reset, and experiment with a Compose stack

## Architecture

Running `docker compose up --build` starts three services on a shared Docker bridge network named `quiz-network`.

```text
+------------------------------------------------------------------+
|                         quiz-network                              |
|                                                                  |
|   +-------------+        +-------------+        +---------------+ |
|   |  quiz-app   | -----> |    mongo    | <----- | mongo-express | |
|   | Flask :5000 |        | DB :27017   |        | Web UI :8081  | |
|   +-------------+        +-------------+        +---------------+ |
|                                                                  |
|   localhost:5000        stores app data         localhost:8081   |
+------------------------------------------------------------------+
```

## Services

| Service | Container | Port | Purpose |
| --- | --- | --- | --- |
| `quiz-app` | `dockerquiz-app` | `5000` | Flask quiz application |
| `mongo` | `dockerquiz-mongo` | `27017` | MongoDB database |
| `mongo-express` | `dockerquiz-mongo-express` | `8081` | Browser-based MongoDB admin UI |

## Project Structure

```text
running docker compose/
|-- app.py
|-- Dockerfile
|-- docker-compose.yml
|-- requirements.txt
|-- .dockerignore
|-- README.md
`-- templates/
    |-- base.html
    |-- index.html
    |-- question.html
    |-- feedback.html
    `-- results.html
```

## Prerequisites

You only need Docker Desktop.

- macOS: https://docs.docker.com/desktop/install/mac-install/
- Windows: https://docs.docker.com/desktop/install/windows-install/
- Linux: https://docs.docker.com/desktop/install/linux-install/

No local Python, MongoDB, or Node.js setup is required.

## Getting Started

Clone the repository:

```bash
git clone https://github.com/samuel-nartey/devops-labs.git
cd "devops-labs/Docker & Containers/Running Your First Container/running docker compose"
```

Start the full stack:

```bash
docker compose up --build
```

On the first run, Docker may take a few minutes to download the MongoDB and Mongo Express images. Later runs should be much faster.

## Open the Apps

After the containers start, open:

| App | URL | Description |
| --- | --- | --- |
| Quiz App | http://localhost:5000 | Create a profile and play the Docker quiz |
| Mongo Express | http://localhost:8081 | Browse the MongoDB database visually |

## How to Use It

1. Go to http://localhost:5000.
2. Create a profile with your name, role, and avatar.
3. Answer all 20 Docker questions.
4. View your final score and grade.
5. Open http://localhost:8081.
6. Browse the `dockerquiz` database.
7. Inspect the `profiles`, `quiz_states`, and `results` collections.

## Why the App Uses `mongo` Instead of `localhost`

Inside Docker Compose, containers communicate through service names.

The Flask app connects to MongoDB with:

```python
MONGO_URI = "mongodb://mongo:27017/"
```

`mongo` is the service name from `docker-compose.yml`. Because `quiz-app` and `mongo` are on the same Docker network, Docker resolves `mongo` to the MongoDB container automatically.

This is Docker's built-in DNS and one of the most important concepts in the project.

## Docker Compose Overview

```yaml
services:
  quiz-app:
    build: .
    container_name: dockerquiz-app
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/
    depends_on:
      - mongo
    networks:
      - quiz-network

  mongo:
    image: mongo:7.0
    container_name: dockerquiz-mongo
    volumes:
      - mongo-data:/data/db
    networks:
      - quiz-network

  mongo-express:
    image: mongo-express:1.0.2
    container_name: dockerquiz-mongo-express
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_SERVER: mongo
    depends_on:
      - mongo
    networks:
      - quiz-network

volumes:
  mongo-data:

networks:
  quiz-network:
    driver: bridge
```

## Data Stored in MongoDB

The app writes quiz activity into three collections.

### `profiles`

Created when a user submits the profile form.

```json
{
  "name": "Samuel Nartey",
  "avatar": "whale",
  "role": "DevOps Engineer",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### `quiz_states`

Updated while the user is answering questions.

```json
{
  "sid": "a3f9c2b1d4e87f09...",
  "profile_name": "Samuel Nartey",
  "score": 60,
  "current": 7,
  "wrong": [2, 5]
}
```

### `results`

Created when the user completes the quiz.

```json
{
  "name": "Samuel Nartey",
  "score": 170,
  "total": 200,
  "percentage": 85,
  "grade": "Container Expert",
  "num_correct": 17,
  "num_wrong": 3,
  "wrong_question_ids": [4, 9, 14],
  "completed_at": "2024-01-15T10:45:00Z"
}
```

## Useful Commands

See running containers:

```bash
docker ps
```

Stream app logs:

```bash
docker logs dockerquiz-app -f
```

Stream database logs:

```bash
docker logs dockerquiz-mongo -f
```

Open a shell inside the app container:

```bash
docker exec -it dockerquiz-app bash
```

Open a MongoDB shell:

```bash
docker exec -it dockerquiz-mongo mongosh
```

Query the database from `mongosh`:

```javascript
use dockerquiz
db.profiles.find().pretty()
db.results.find().pretty()
db.quiz_states.find().pretty()
```

Inspect networks:

```bash
docker network ls
docker network inspect docker-quiz-v2_quiz-network
```

Inspect volumes:

```bash
docker volume ls
```

## Stopping and Resetting

Stop containers while keeping saved quiz data:

```bash
docker compose down
```

Stop containers and delete saved MongoDB data:

```bash
docker compose down -v
```

Rebuild after code changes:

```bash
docker compose up --build
```

Force a clean rebuild:

```bash
docker compose up --build --no-cache
```

## Session Design

The app stores the quiz session ID in the URL instead of relying on cookies:

```text
http://localhost:5000/question/a3f9c2b1d4e87f09...
```

The session state is stored in MongoDB and looked up on each request. This keeps the app simple for Docker learners and makes quiz progress easy to inspect in Mongo Express.

## Grade System

| Score | Grade |
| --- | --- |
| 90-100% | Docker Captain |
| 75-89% | Container Expert |
| 60-74% | Image Builder |
| 40-59% | Dockerfile Rookie |
| 0-39% | Whale Watcher |

## Experiment Ideas

- Add a new question to the `QUESTIONS` list in `app.py`.
- Change the host port from `5000` to `8000`.
- Add a new profile field in `templates/index.html`.
- Change the app theme in `templates/base.html`.
- Comment out `depends_on` and observe startup behavior.
- Add a leaderboard using the `results` collection.

## FAQ

### Do I need to install Python or MongoDB?

No. Docker runs Python, Flask, MongoDB, and Mongo Express inside containers.

### Why does the first run take a while?

Docker needs to download the MongoDB and Mongo Express images the first time. After that, startup is much faster.

### Why do I see "MongoDB not ready" in the logs?

The Flask app may start before MongoDB is fully ready. The app retries the connection, so this message is expected during startup.

### How do I reset all quiz data?

Run:

```bash
docker compose down -v
docker compose up --build
```

The `-v` flag removes the named MongoDB volume.

### Can multiple people play at the same time?

Yes. Each player gets a unique session ID, so their quiz progress is tracked independently.

