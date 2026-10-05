<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class ApiController extends Controller
{
    public function __construct()
    {
        parent::__construct();

        $this->call->database();
        $this->call->library('api');
    }

    // POST /create
    public function create()
    {
        $this->api->require_method('POST');

        $input = $this->api->body();

        $this->db->raw(
            "INSERT INTO users (username, email, password, role, created_at)
             VALUES (?, ?, ?, ?, NOW())",
            [
                $input['username'],
                $input['email'],
                password_hash($input['password'], PASSWORD_BCRYPT),
                $input['role'] ?? 'user'
            ]
        );

        $this->api->respond([
            'message' => 'User created'
        ], 201);
    }

    // POST /login
    public function login()
    {
        $this->api->require_method('POST');

        $input = $this->api->body();

        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';

        $stmt = $this->db->raw(
            'SELECT * FROM users WHERE username = ?',
            [$username]
        );

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {

            $tokens = $this->api->issue_tokens([
                'id'   => $user['id'],
                'role' => $user['role']
            ]);

            $this->api->respond($tokens);

        } else {
            $this->api->respond_error('Invalid credentials', 401);
        }
    }

    // POST /logout
    public function logout()
    {
        $this->api->require_method('POST');

        $input = $this->api->body();

        $this->api->revoke_refresh_token(
            $input['refresh_token'] ?? ''
        );

        $this->api->respond([
            'message' => 'Logged out'
        ]);
    }

    // GET /list
    public function list()
    {
        $this->api->rate_limit();

        $users = $this->db->table('users')
                          ->select('id, username, email, role, created_at')
                          ->get_all();

        $this->api->respond($users);
    }

    // GET /profile
    public function profile()
    {
        $auth = $this->api->require_jwt();

        $stmt = $this->db->raw(
            'SELECT id, username, email, role, created_at
             FROM users
             WHERE id = ?',
            [$auth['sub']]
        );

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->api->respond(
            $user ?: ['message' => 'User not found']
        );
    }

    // PUT /update/{id}
    public function update($id)
    {
        $this->api->require_method('PUT');

        $input = $this->api->body();

        $this->db->raw(
            'UPDATE users
             SET username = ?, email = ?, role = ?
             WHERE id = ?',
            [
                $input['username'],
                $input['email'],
                $input['role'],
                $id
            ]
        );

        $this->api->respond([
            'message' => 'User updated'
        ]);
    }

    // DELETE /delete/{id}
    public function delete($id)
    {
        $this->api->require_method('DELETE');

        $this->db->raw(
            'DELETE FROM users WHERE id = ?',
            [$id]
        );

        $this->api->respond([
            'message' => 'User deleted'
        ]);
    }

    // POST /refresh
    public function refresh()
    {
        $this->api->require_method('POST');

        $input = $this->api->body();

        $this->api->refresh_access_token(
            $input['refresh_token'] ?? ''
        );
    }
}