# SecureVote: Blockchain-based Voting Platform

A secure, biometric, blockchain-based voting platform built for educational purposes.

## 🚀 Key Features

- **Blockchain-Verified Voting**: Every vote is recorded on a centralized educational blockchain (SHA-256, PoW) and persisted in MongoDB.
- **Biometric Authentication**: Face recognition using `face-api.js` for secure login (1:1 verification).
- **Transparency**: Public verification of votes using transaction hashes or human-readable Verification Codes (`VOTE-XXXX-XXXX`).
- **Live Dashboards**: Real-time updates for both voters and administrators.
- **KYC Verification**: Basic identity verification flow.

## 🛠 Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (Serverless)
- **Database**: MongoDB Atlas (Free Tier)
- **Blockchain**: Custom educational implementation (Typescript)
- **Face Auth**: face-api.js (running in browser, verification on backend)

## 📦 Setup Instructions

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a `.env.local` file in the root directory and add your keys:
    ```env
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/blockchainVote
    JWT_SECRET=your-secure-secret
    ```
4.  **Run the development server**:
    ```bash
    npm run dev
    ```
5.  **Build for production**:
    ```bash
    npm run build
    npm start
    ```

## 🔐 Architecture

- **User**: Stores user profiles, roles (USER/ADMIN), and face descriptors.
- **Election**: Stores election metadata, candidates, and status.
- **Vote**: Stores individual vote transactions, including blockchain metadata.
- **Block**: Stores the blockchain structure.

### Voting Flow
1.  User registers with Face ID (webcam).
2.  User logs in (Email + Face or Password).
3.  User selects an active election.
4.  Vote is cast -> Mined -> Saved to MongoDB.
5.  User receives a Vote Receipt.

### Verification Flow
- Scan the QR code or visit `/verify`.
- Enter the Transaction Hash or Verification Code.
- System queries the blockchain (MongoDB) to confirm validity.

## ⚠️ Educational Note

This project implements a **centralized** blockchain for demonstration. It ensures data integrity using cryptographic hashes but runs on a single server node connected to MongoDB.
