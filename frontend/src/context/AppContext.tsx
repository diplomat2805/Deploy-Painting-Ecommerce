import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

export interface Artwork {
  id: string
  title: string
  price: number
  category: string
  size: string
  image: string
  images: string[]
  description: string
  dimensions: string
  availability: 'available' | 'sold' | 'reserved'
  featured?: boolean
  trending?: boolean
  newArrival?: boolean
}

export interface CartItem {
  artwork: Artwork
  quantity: number
}

interface UserType {
  _id: string
  name: string
  email: string
  token: string
  isAdmin: boolean
}

interface AppContextType {
  cart: CartItem[]
  wishlist: Artwork[]
  addToCart: (artwork: Artwork) => void
  removeFromCart: (artworkId: string) => void
  updateCartQuantity: (artworkId: string, quantity: number) => void
  addToWishlist: (artwork: Artwork) => void
  removeFromWishlist: (artworkId: string) => void
  isInWishlist: (artworkId: string) => boolean
  clearCart: () => void

  user: UserType | null
  login: (email: string, password: string) => Promise<UserType>
  logout: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const GUEST_CART_KEY = 'cart_guest'

function getUserCartKey(email: string) {
  return `cart_${email}`
}

// Merge carts
function mergeCarts(guest: CartItem[] = [], user: CartItem[] = []): CartItem[] {
  const map = new Map<string, CartItem>()

  for (const item of user) {
    map.set(item.artwork.id, { ...item })
  }

  for (const item of guest) {
    const existing = map.get(item.artwork.id)
    if (existing) existing.quantity += item.quantity
    else map.set(item.artwork.id, { ...item })
  }

  return Array.from(map.values())
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<Artwork[]>([])
  const [user, setUser] = useState<UserType | null>(null)

  // Restore everything
  useEffect(() => {
    const savedUserStr = localStorage.getItem('user')
    let savedUser: UserType | null = null

    if (savedUserStr) {
      try {
        savedUser = JSON.parse(savedUserStr)
        setUser(savedUser)
      } catch {
        savedUser = null
      }
    }

    if (savedUser) {
      const userCart = localStorage.getItem(getUserCartKey(savedUser.email))
      if (userCart) setCart(JSON.parse(userCart))
    } else {
      const guestCart = localStorage.getItem(GUEST_CART_KEY)
      if (guestCart) setCart(JSON.parse(guestCart))
    }

    const savedWishlist = localStorage.getItem('wishlist')
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist))
  }, [])

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist))
  }, [wishlist])

  useEffect(() => {
    const key = user ? getUserCartKey(user.email) : GUEST_CART_KEY
    localStorage.setItem(key, JSON.stringify(cart))
  }, [cart, user])

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  const addToCart = (artwork: Artwork) => {
    setCart(prev => {
      const existing = prev.find(item => item.artwork.id === artwork.id)
      if (existing) {
        return prev.map(item =>
          item.artwork.id === artwork.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { artwork, quantity: 1 }]
    })
  }

  const removeFromCart = (artworkId: string) => {
    setCart(prev => prev.filter(item => item.artwork.id !== artworkId))
  }

  const updateCartQuantity = (artworkId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(artworkId)

    setCart(prev =>
      prev.map(item =>
        item.artwork.id === artworkId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => setCart([])

  const addToWishlist = (artwork: Artwork) => {
    setWishlist(prev => {
      if (prev.find(item => item.id === artwork.id)) return prev
      return [...prev, artwork]
    })
  }

  const removeFromWishlist = (artworkId: string) => {
    setWishlist(prev => prev.filter(item => item.id !== artworkId))
  }

  const isInWishlist = (artworkId: string) =>
    wishlist.some(item => item.id === artworkId)

  // LOGIN fixed — NO MULTILINE URL
  const login = async (email: string, password: string): Promise<UserType> => {
    try {
      const { data } = await axios.post(
        "https://creative-palette-api.onrender.com/api/auth/login",
        { email, password }
      )

      const userData: UserType = {
        _id: data._id,
        name: data.name,
        email: data.email,
        token: data.token,
        isAdmin: data.role === "admin"
      }

      const guestCartStr = localStorage.getItem(GUEST_CART_KEY)
      const userCartKey = getUserCartKey(userData.email)
      const userCartStr = localStorage.getItem(userCartKey)

      let guestCart: CartItem[] = guestCartStr ? JSON.parse(guestCartStr) : []
      let userCart: CartItem[] = userCartStr ? JSON.parse(userCartStr) : []

      const mergedCart = mergeCarts(guestCart, userCart)

      setUser(userData)
      setCart(mergedCart)

      localStorage.setItem("token", data.token)
      localStorage.setItem(userCartKey, JSON.stringify(mergedCart))
      localStorage.removeItem(GUEST_CART_KEY)

      return userData
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed")
    }
  }

  const logout = () => {
    if (user) {
      const key = getUserCartKey(user.email)
      localStorage.setItem(key, JSON.stringify(cart))
    }

    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")

    const guestCartStr = localStorage.getItem(GUEST_CART_KEY)
    setCart(guestCartStr ? JSON.parse(guestCartStr) : [])
  }

  return (
    <AppContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearCart,
        user,
        login,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
