import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:3000'

function App() {
  const [token, setToken] = useState(
    localStorage.getItem('access_token')
  )

  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem('refresh_token')
  )

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [products, setProducts] = useState([])

  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')

  const [editingId, setEditingId] = useState(null)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)

  // =========================
  // LOGIN
  // =========================
  const login = async (e) => {
    e.preventDefault()

    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Invalid username or password.'
        )
      }

      localStorage.setItem(
        'access_token',
        data.access_token
      )

      localStorage.setItem(
        'refresh_token',
        data.refresh_token
      )

      setToken(data.access_token)
      setRefreshToken(data.refresh_token)

      setUsername('')
      setPassword('')

      setMessage('Login successful.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {
    try {
      if (refreshToken) {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        })
      }
    } catch (err) {
      console.log('Logout request failed:', err)
    }

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    setToken(null)
    setRefreshToken(null)
    setProducts([])
    setMessage('')
    setError('')
  }

  // =========================
  // LOAD PRODUCTS
  // =========================
  const loadProducts = async () => {
    if (!token) return

    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/products`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.status === 401) {
        const newToken = await refreshAccessToken()

        if (!newToken) {
          setError('Session expired. Please login again.')
          return
        }

        const retryResponse = await fetch(
          `${API_URL}/api/products`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          }
        )

        const retryData = await retryResponse.json()

        if (!retryResponse.ok) {
          throw new Error(
            retryData.message ||
              'Failed to load products.'
          )
        }

        setProducts(
          Array.isArray(retryData)
            ? retryData
            : []
        )

        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load products.'
        )
      }

      setProducts(
        Array.isArray(data) ? data : []
      )
    } catch (err) {
      setError(err.message)
    }
  }

  // =========================
  // REFRESH ACCESS TOKEN
  // =========================
  const refreshAccessToken = async () => {
    if (!refreshToken) return null

    try {
      const response = await fetch(
        `${API_URL}/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        return null
      }

      if (data.access_token) {
        localStorage.setItem(
          'access_token',
          data.access_token
        )

        setToken(data.access_token)

        return data.access_token
      }

      return null
    } catch (err) {
      console.log(
        'Token refresh failed:',
        err
      )

      return null
    }
  }

  // =========================
  // SAVE PRODUCT
  // =========================
  const saveProduct = async (e) => {
    e.preventDefault()

    setError('')
    setMessage('')

    if (!productName.trim()) {
      setError('Product name is required.')
      return
    }

    if (price === '' || quantity === '') {
      setError(
        'Price and quantity are required.'
      )
      return
    }

    const productData = {
      product_name: productName,
      description: description,
      price: Number(price),
      quantity: Number(quantity),
    }

    try {
      let response

      if (editingId) {
        response = await fetch(
          `${API_URL}/api/products/${editingId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
          }
        )
      } else {
        response = await fetch(
          `${API_URL}/api/products`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
          }
        )
      }

      if (response.status === 401) {
        const newToken =
          await refreshAccessToken()

        if (!newToken) {
          setError(
            'Session expired. Please login again.'
          )
          return
        }

        if (editingId) {
          response = await fetch(
            `${API_URL}/api/products/${editingId}`,
            {
              method: 'PUT',
              headers: {
                Authorization:
                  `Bearer ${newToken}`,
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify(productData),
            }
          )
        } else {
          response = await fetch(
            `${API_URL}/api/products`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${newToken}`,
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify(productData),
            }
          )
        }
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to save product.'
        )
      }

      if (editingId) {
        setMessage(
          'Product updated successfully.'
        )
      } else {
        setMessage(
          'Product added successfully.'
        )
      }

      clearForm()
      await loadProducts()
    } catch (err) {
      setError(err.message)
    }
  }

  // =========================
  // EDIT PRODUCT
  // =========================
  const editProduct = (product) => {
    setEditingId(product.id)

    setProductName(
      product.product_name || ''
    )

    setDescription(
      product.description || ''
    )

    setPrice(product.price || '')
    setQuantity(product.quantity || '')

    setMessage('')
    setError('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // =========================
  // DELETE PRODUCT
  // =========================
  const deleteProduct = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?'
    )

    if (!confirmed) return

    setError('')
    setMessage('')

    try {
      let response = await fetch(
        `${API_URL}/api/products/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization:
              `Bearer ${token}`,
            'Content-Type':
              'application/json',
          },
        }
      )

      if (response.status === 401) {
        const newToken =
          await refreshAccessToken()

        if (!newToken) {
          setError(
            'Session expired. Please login again.'
          )
          return
        }

        response = await fetch(
          `${API_URL}/api/products/${id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization:
                `Bearer ${newToken}`,
              'Content-Type':
                'application/json',
            },
          }
        )
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to delete product.'
        )
      }

      setMessage(
        'Product deleted successfully.'
      )

      await loadProducts()
    } catch (err) {
      setError(err.message)
    }
  }

  // =========================
  // CLEAR FORM
  // =========================
  const clearForm = () => {
    setEditingId(null)
    setProductName('')
    setDescription('')
    setPrice('')
    setQuantity('')
  }

  // =========================
  // LOAD PRODUCTS AFTER LOGIN
  // =========================
  useEffect(() => {
    if (token) {
      loadProducts()
    }
  }, [token])

  // =========================
  // STATISTICS
  // =========================
  const totalProducts =
    products.length

  const totalQuantity =
    products.reduce(
      (total, product) =>
        total +
        Number(product.quantity || 0),
      0
    )

  const inventoryValue =
    products.reduce(
      (total, product) =>
        total +
        Number(product.price || 0) *
          Number(product.quantity || 0),
      0
    )

  const formatCurrency = (value) => {
    return Number(value).toLocaleString(
      'en-PH',
      {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
      }
    )
  }

  // =========================
  // LOGIN PAGE
  // =========================
  if (!token) {
    return (
      <div className="login-page">
        <div className="login-container">

          <div className="login-brand">

            <div className="brand-icon">
              P
            </div>

            <h1>
              Product Management
            </h1>

            <p>
              LavaLust API + React
            </p>

          </div>

          <div className="login-card">

            <h2>
              Welcome back
            </h2>

            <p className="login-description">
              Sign in to manage your products.
            </p>

            {error && (
              <div className="alert error">
                {error}
              </div>
            )}

            {message && (
              <div className="alert success">
                {message}
              </div>
            )}

            <form onSubmit={login}>

              <div className="form-group">

                <label>
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                    )
                  }
                  placeholder="Enter username"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter password"
                  required
                />

              </div>

              <button
                type="submit"
                className="primary-button login-button"
                disabled={loading}
              >
                {loading
                  ? 'Signing in...'
                  : 'Sign In'}
              </button>

            </form>

          </div>

        </div>
      </div>
    )
  }

  // =========================
  // DASHBOARD
  // =========================
  return (
    <div className="dashboard">

      <main className="main-content">

        {/* HEADER */}
        <header className="dashboard-header">

          <div>

            <p className="breadcrumb">
              Dashboard / Products
            </p>

            <h1>
              Product Management
            </h1>

          </div>

          <div className="header-actions">

            <button
              onClick={loadProducts}
              className="refresh-button"
            >
              ↻ Refresh
            </button>

            <button
              onClick={logout}
              className="logout-button"
            >
              Logout
            </button>

          </div>

        </header>

        {/* ALERTS */}
        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="alert success">
            {message}
          </div>
        )}

        {/* STATISTICS */}
        <section className="stats">

          <div className="stat-card">

            <div className="stat-icon">
              ▦
            </div>

            <div>

              <span>
                Total Products
              </span>

              <strong>
                {totalProducts}
              </strong>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              #
            </div>

            <div>

              <span>
                Total Quantity
              </span>

              <strong>
                {totalQuantity}
              </strong>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ₱
            </div>

            <div>

              <span>
                Inventory Value
              </span>

              <strong>
                {formatCurrency(
                  inventoryValue
                )}
              </strong>

            </div>

          </div>

        </section>

        {/* ADD / EDIT PRODUCT */}
        <section className="content-card">

          <div className="section-title">

            <div>

              <h2>
                {editingId
                  ? 'Edit Product'
                  : 'Add New Product'}
              </h2>

              <p>
                {editingId
                  ? 'Update the product details below.'
                  : 'Enter the product details below.'}
              </p>

            </div>

            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                className="cancel-button"
              >
                Cancel
              </button>
            )}

          </div>

          <form onSubmit={saveProduct}>

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Product Name
                </label>

                <input
                  type="text"
                  value={productName}
                  onChange={(e) =>
                    setProductName(
                      e.target.value
                    )
                  }
                  placeholder="Enter product name"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Enter product description"
                />

              </div>

              <div className="form-group">

                <label>
                  Price
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value
                    )
                  }
                  placeholder="0.00"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      e.target.value
                    )
                  }
                  placeholder="0"
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className="primary-button"
            >
              {editingId
                ? 'Update Product'
                : '+ Add Product'}
            </button>

          </form>

        </section>

        {/* PRODUCTS */}
        <section className="content-card">

          <div className="section-title">

            <div>

              <h2>
                Products
              </h2>

              <p>
                Manage your current product inventory.
              </p>

            </div>

          </div>

          {products.length === 0 ? (

            <div className="empty-state">

              <h3>
                No products found
              </h3>

              <p>
                Add your first product using the form above.
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      ID
                    </th>

                    <th>
                      PRODUCT
                    </th>

                    <th>
                      DESCRIPTION
                    </th>

                    <th>
                      PRICE
                    </th>

                    <th>
                      QTY
                    </th>

                    <th>
                      CREATED
                    </th>

                    <th>
                      ACTIONS
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {products.map(
                    (product) => (

                      <tr
                        key={product.id}
                      >

                        <td className="product-id">
                          #{product.id}
                        </td>

                        <td>
                          <strong>
                            {
                              product.product_name
                            }
                          </strong>
                        </td>

                        <td className="description-cell">
                          {
                            product.description ||
                            '—'
                          }
                        </td>

                        <td className="price-cell">
                          {formatCurrency(
                            product.price
                          )}
                        </td>

                        <td>

                          <span className="quantity-badge">
                            {
                              product.quantity
                            }
                          </span>

                        </td>

                        <td className="date-cell">
                          {
                            product.created_at ||
                            '—'
                          }
                        </td>

                        <td>

                          <div className="actions">

                            <button
                              type="button"
                              onClick={() =>
                                editProduct(
                                  product
                                )
                              }
                              className="edit-button"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteProduct(
                                  product.id
                                )
                              }
                              className="delete-button"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        <footer>
          Product Management System • React + LavaLust API
        </footer>

      </main>

    </div>
  )
}

export default App