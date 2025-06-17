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
   - Provides example queries for testing
   - Maintains synchronized state with Y.js

3. **API Server**
   - REST API endpoints for querying Prolog knowledge base
   - Endpoints for adding rules and executing queries
   - Built with Express.js
   - Includes error handling middleware

## Installation

1. Install Node.js and npm (or pnpm)
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
   - Create a `watched_json_files` directory
   - Start monitoring for JSON files
   - Initialize the Prolog engine
   - Start the API server on port 3000

3. To use the system:
   - Place JSON files in the `watched_json_files` directory
   - The system will automatically:
     - Process new/changed files
     - Update the Y.js document
     - Rebuild the Prolog knowledge base
     - Run example queries

4. API Endpoints:
   - `POST /api/rules` - Add a new Prolog rule
   - `POST /api/query` - Execute a Prolog query

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

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Acknowledgments

- Y.js for real-time collaboration
- SWI-Prolog for logic programming
- Chokidar for efficient file watching
- Express.js for web server functionality
