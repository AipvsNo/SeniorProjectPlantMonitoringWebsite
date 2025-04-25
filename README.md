# Plantique

Senior Project.
## Additional Resources
- [Documents](DOCUMENTS.md)


# Project Structure

```plaintext
PLANTIQUE/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── node_modules/
│   ├── python_model/
│   ├── routes/
│   ├── .dockerignore
│   ├── .env
│   ├── app.js
│   ├── Dockerfile
│   ├── package-lock.json
│   └── package.json
├── frontend/
│   ├── node_modules/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .dockerignore
│   ├── .env
│   ├── .prettierrc.json
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── favicon.ico
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
├── production/
├── .gitignore
└── commands.md

```

# Project Architecture
```plaintext
   +----------+          +----------+          +----------+
   | Frontend | ←────→   | Backend  | ←────→   | Database |
   | React    |          | NodeJS   |          | MongoDB  |
   +----------+          +----------+          +----------+
```
The project is divided into three main building blocks:

1. **Database**
   - MongoDB

2. **Backend**
   - Node.js REST API
   - Python model

3. **Frontend**
   - React-based Single Page Application (SPA)
   - Tailwind CSS






