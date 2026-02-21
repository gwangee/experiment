from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), 'todos.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                done INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/todos', methods=['GET'])
def get_todos():
    with get_db() as conn:
        todos = conn.execute(
            'SELECT * FROM todos ORDER BY created_at DESC'
        ).fetchall()
    return jsonify([dict(t) for t in todos])


@app.route('/api/todos', methods=['POST'])
def add_todo():
    data = request.get_json()
    title = data.get('title', '').strip()
    if not title:
        return jsonify({'error': '할 일을 입력해주세요.'}), 400
    with get_db() as conn:
        cursor = conn.execute(
            'INSERT INTO todos (title) VALUES (?)', (title,)
        )
        todo = conn.execute(
            'SELECT * FROM todos WHERE id = ?', (cursor.lastrowid,)
        ).fetchone()
    return jsonify(dict(todo)), 201


@app.route('/api/todos/<int:todo_id>', methods=['PATCH'])
def toggle_todo(todo_id):
    with get_db() as conn:
        conn.execute(
            'UPDATE todos SET done = NOT done WHERE id = ?', (todo_id,)
        )
        todo = conn.execute(
            'SELECT * FROM todos WHERE id = ?', (todo_id,)
        ).fetchone()
    if not todo:
        return jsonify({'error': '찾을 수 없습니다.'}), 404
    return jsonify(dict(todo))


@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    with get_db() as conn:
        conn.execute('DELETE FROM todos WHERE id = ?', (todo_id,))
    return '', 204


if __name__ == '__main__':
    init_db()
    app.run(debug=True)
