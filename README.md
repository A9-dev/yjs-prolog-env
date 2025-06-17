# JSON-YJS-Watcher

A real-time JSON file monitoring system that integrates with Prolog for query processing. This project watches a directory for JSON files, maintains a synchronized state using Y.js, and provides a Prolog-based query interface for analyzing the JSON data.

## Overview

JSON-YJS-Watcher is a system designed to:

- Monitor a directory for JSON files
- Maintain synchronized state using Y.js
- Automatically convert JSON data into Prolog knowledge base
- Provide a REST API for querying the data using Prolog
- Support real-time updates and collaborative editing

## Architecture

The system consists of several key components:

1. **JSONFileWatcher**

   - Monitors a specified directory for JSON files
   - Uses Chokidar for efficient file system watching
   - Processes JSON files and updates Y.js document
   - Maintains file state and timestamps

2. **PrologBuilder**

   - Converts JSON data into Prolog knowledge base
   - Uses SWI-Prolog for Prolog execution
   - Maintains synchronized state with Y.js

3. **API Server**
   - REST API endpoints for querying Prolog knowledge base
   - Endpoints for adding rules and executing queries
   - Built with Express.js
   - Includes error handling middleware

## Installation

1. Install Node.js and pnpm
2. Clone the repository
3. Install dependencies:
   ```bash
   pnpm install
   ```

## Usage

1. Start the server:

   ```bash
   pnpm dev
   ```

2. The server will:

   - Create a `watched_json_files/` directory
   - Start monitoring for JSON files
   - Initialize the Prolog engine
   - Start the API server on port 3000

3. To use the system:

   - Place JSON files from `example_prolog/` or elsewhere in the `watched_json_files/` directory
   - The system will automatically:
     - Process new/changed files
     - Update the Y.js document
     - Rebuild the Prolog knowledge base

4. API Endpoints:
   - `POST /api/rules` - Add a new Prolog rule
   - `POST /api/query` - Execute a Prolog query
     - You can find example queries in `example_queries/` for each example prolog rule set in `example_prolog/`.

## API Input Formats

### Add a Prolog Rule

**POST** `/api/rules`

Request body:

```json
{
  "prolog": ":- dynamic parent/2, ancestor/2, cousin/2, uncle/2.\n\nparent(alice, bob).\nparent(alice, claire).\nparent(bob, david).\nparent(claire, emily).\nparent(david, frank).\nparent(emily, george).\n\nancestor(X, Y) :- parent(X, Y).\nancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).\n\nsibling(X, Y) :- parent(Z, X), parent(Z, Y), X \\= Y.\n\ncousin(X, Y) :-\n    parent(A, X),\n    parent(B, Y),\n    sibling(A, B).\n\nuncle(X, Y) :-\n    parent(P, Y),\n    sibling(X, P),\n    male(X).\n\nmale(bob).\nmale(david).\nmale(frank).\nmale(george).\nmale(john)."
}
```

### Query the Prolog Knowledge Base

**POST** `/api/query`

Request body:

```json
{
  "query": "ancestor(alice, george)."
}
```

## Project Structure

```
src/
├── api/              # Express API routes
├── middleware/       # Error handling middleware
├── services/         # Service layer
├── JSONFileWatcher.ts # File watching implementation
├── PrologBuilder.ts  # Prolog integration
├── yjsInstance.ts    # Y.js document instance
└── logger.ts         # Logging configuration
```

## Features

- Real-time file monitoring
- Automatic JSON processing
- Y.js synchronized state
- Prolog query interface
- REST API endpoints
- Example queries included
- Error handling and logging

## Development

The project uses:

- TypeScript for type safety
- Y.js for real-time collaboration
- SWI-Prolog for logic programming
- Express.js for the API server
- Chokidar for file system watching
- Pino for logging
