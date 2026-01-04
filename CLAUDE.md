# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start Expo development server
- `npm run android` - Start with Android emulator
- `npm run ios` - Start with iOS simulator
- `npm run web` - Start web version
- `npm run lint` - Run ESLint
- `npm run reset-project` - Reset to blank project structure

## Project Architecture

### Tech Stack
- **Framework**: React Native with Expo Router (file-based routing)
- **State Management**: Zustand stores
- **API Client**: Axios with automatic token refresh
- **Storage**: Expo SecureStore for tokens, AsyncStorage for local data
- **Network Detection**: NetInfo for offline/online sync capabilities

### Core Architecture Patterns

#### 1. Store-Based State Management
The app uses Zustand stores for state management:
- `authStore.ts` - Authentication, user data, token management
- `productsStore.ts` - Product catalog and search
- `invoicesStore.ts` - Invoice CRUD with offline sync capabilities
- `cartStore.ts` - Shopping cart state
- `syncStore.ts` - Network status and sync orchestration
- `categoriesStore.ts` - Product categories management
- `reportsStore.ts` - Dashboard stats, sales and product reports
- `storesStore.ts` - Store and role information

#### 2. API Client with Token Management
`api/apiClient.ts` implements:
- Comprehensive API coverage matching Django backend
- Automatic JWT token refresh on 401 responses
- Request queuing during token refresh
- Bearer token attachment to all requests
- Base URL: `https://surelaces.mwonya.com`
- Full CRUD operations for products, categories, invoices
- Reports and analytics endpoints
- Social authentication support (Google, Facebook, Apple)

#### 3. Offline-First Invoice System
Key pattern for invoice handling:
- Local storage with AsyncStorage as source of truth
- `sync_status` field tracks: 'PENDING' | 'SYNCED' | 'FAILED'
- Bulk sync endpoint for efficient server synchronization
- UUID validation for all product and user references

#### 4. Role-Based Navigation
File-based routing with role-specific layouts:
- `app/(auth)/` - Login screens
- `app/(salesperson)/` - Sales interface (cart, products, invoices)
- `app/(owner)/` - Management interface (dashboard, reports, sales)
- Auto-redirect based on `user.role` from auth store

#### 5. Network-Aware Sync
`syncStore.ts` orchestrates:
- Network state monitoring with NetInfo
- Automatic sync when connectivity restored
- Sync status indicators throughout UI
- Pending invoice count tracking

### Key Data Flows

#### Authentication Flow
1. Login → API returns user + tokens (access/refresh format)
2. JWT exp decoded for token refresh timing (24hr default)
3. Tokens stored in SecureStore with {access, refresh} structure
4. 401 responses trigger automatic token refresh with request queuing
5. Full registration/verification flow supported
6. Password reset with email verification codes
7. Social authentication options available

#### Invoice Creation Flow
1. Products selected in cart → Invoice created locally with 'PENDING' status
2. Immediate sync attempt (fails if offline)
3. Background sync when network restored
4. Bulk sync endpoint processes multiple invoices efficiently

#### Data Validation Requirements
- All product IDs must be valid UUIDs
- All user IDs must be valid UUIDs
- Invoice items require: product (UUID), product_name, product_code, quantity, price
- UUID validation performed before sync attempts
- Price fields are strings in API (backend requirement)
- Pagination support for all list endpoints

### Important Implementation Notes

#### Secure Storage
- Use `secureStorage.ts` wrapper for token operations
- Tokens have `expiresAt` timestamp for validation
- Clear all storage on logout

#### Error Handling
- API errors bubble up to stores with user-friendly messages
- Failed invoices remain in local storage for retry
- Invalid UUIDs prevent sync and log warnings

#### TypeScript Types
- Core types defined in `types/index.ts`
- Strict typing for all API requests/responses
- Role-based type unions for user permissions