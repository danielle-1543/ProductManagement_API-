<?php
defined('PREVENT_DIRECT_ACCESS') OR exit('No direct script access allowed');

class ProductsController extends Controller
{
    public function __construct()
    {
        parent::__construct();

        $this->call->database();
        $this->call->model('ProductsModel');
        $this->call->library('api');
    }

    // GET /api/products
    public function index()
    {
        $this->api->require_jwt();

        $products = $this->ProductsModel->all();

        $this->api->respond($products);
    }

    // POST /api/products
    public function store()
    {
        $this->api->require_jwt();
        $this->api->require_method('POST');

        $input = $this->api->body();

        $data = [
            'product_name' => $input['product_name'] ?? '',
            'description'  => $input['description'] ?? '',
            'price'        => $input['price'] ?? 0,
            'quantity'     => $input['quantity'] ?? 0
        ];

        $this->ProductsModel->insert($data);

        $this->api->respond([
            'message' => 'Product created successfully.'
        ], 201);
    }

    // PUT /api/products/{id}
    public function update($id)
    {
        $this->api->require_jwt();
        $this->api->require_method('PUT');

        $input = $this->api->body();

        $data = [
            'product_name' => $input['product_name'] ?? '',
            'description'  => $input['description'] ?? '',
            'price'        => $input['price'] ?? 0,
            'quantity'     => $input['quantity'] ?? 0
        ];

        $this->ProductsModel->update($id, $data);

        $this->api->respond([
            'message' => 'Product updated successfully.'
        ]);
    }

    // DELETE /api/products/{id}
    public function delete($id)
    {
        $this->api->require_jwt();
        $this->api->require_method('DELETE');

        $this->ProductsModel->delete($id);

        $this->api->respond([
            'message' => 'Product deleted successfully.'
        ]);
    }
}