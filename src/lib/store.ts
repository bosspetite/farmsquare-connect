import {
    AppState,
    Farmer,
    Buyer,
    Listing,
    Order,
    OrderTracking,
    Transaction,
    Wallet,
    MarketPriceIntel,
    KYCData,
    Dispute,
    DisputeStatus,
    Escrow,
    PaymentStatus,
} from "@/types";
import { getProduceImages } from "@/utils/produceImages";

// Platform commission rate (10%)
const PLATFORM_COMMISSION_RATE = 0.1;

const STORAGE_KEY = "farmsquare_state";

// Generate unique IDs
export const generateId = () => Math.random().toString(36).substring(2, 11);

// Initial seed data
const createSeedData = (): AppState => {
    const farmerId = "farmer_001";
    const farmerId2 = "farmer_002";
    const farmerId3 = "farmer_003";
    const buyerId = "buyer_001";
    const agentId = "agent_001";
    const adminId = "admin_001";

    return {
        currentUser: null,
        farmers: [
            {
                id: farmerId,
                name: "Adamu Bello",
                phone: "+2348012345678",
                role: "farmer",
                region: "Kaduna",
                kycStatus: "NOT_STARTED", // Changed from APPROVED to NOT_STARTED
                createdAt: new Date(
                    Date.now() - 30 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: farmerId2,
                name: "Hassan Musa",
                phone: "+2348023456789",
                role: "farmer",
                region: "Benue",
                kycStatus: "APPROVED",
                createdAt: new Date(
                    Date.now() - 25 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: farmerId3,
                name: "Amina Usman",
                phone: "+2348034567890",
                role: "farmer",
                region: "Sokoto",
                kycStatus: "APPROVED",
                createdAt: new Date(
                    Date.now() - 20 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
        ],
        buyers: [
            {
                id: buyerId,
                name: "Ngozi Okonkwo",
                phone: "+2348098765432",
                role: "buyer",
                region: "Lagos",
                kycStatus: "NOT_STARTED", // Changed to NOT_STARTED for testing KYB
                companyName: "AgroTrade Nigeria Ltd",
                createdAt: new Date(
                    Date.now() - 60 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
        ],
        agents: [
            {
                id: agentId,
                name: "Musa Ibrahim",
                phone: "+2348011112222",
                role: "agent",
                region: "Kano",
                kycStatus: "APPROVED",
                farmersOnboarded: 45,
                inspectionsCompleted: 120,
                createdAt: new Date(
                    Date.now() - 90 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
        ],
        admins: [
            {
                id: adminId,
                name: "Admin User",
                phone: "+2348000000000",
                role: "admin",
                region: "Lagos",
                kycStatus: "APPROVED",
                createdAt: new Date(
                    Date.now() - 180 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
        ],
        wallets: [
            {
                userId: farmerId,
                available: 485000,
                pending: 125000,
                locked: 0,
                currency: "₦",
                withdrawn: 200000,
            },
            {
                userId: buyerId,
                available: 2500000,
                pending: 0,
                locked: 0,
                currency: "₦",
            },
        ],
        listings: [
            {
                id: "listing_001",
                farmerId,
                farmerName: "Adamu Bello",
                commodity: "Maize",
                grade: "A",
                quantityKg: 5000,
                pricePerKg: 450,
                photos: getProduceImages("Maize"),
                locationLabel: "Zaria Farm Settlement",
                region: "Kaduna",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 3 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_002",
                farmerId,
                farmerName: "Adamu Bello",
                commodity: "Cassava",
                grade: "B",
                quantityKg: 3000,
                pricePerKg: 280,
                photos: getProduceImages("Cassava"),
                locationLabel: "Zaria Farm Settlement",
                region: "Kaduna",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 7 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_003",
                farmerId,
                farmerName: "Adamu Bello",
                commodity: "Rice",
                grade: "A",
                quantityKg: 4000,
                pricePerKg: 850,
                photos: getProduceImages("Rice"),
                locationLabel: "Kano River Project",
                region: "Kano",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 5 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_004",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Yam",
                grade: "A",
                quantityKg: 2500,
                pricePerKg: 550,
                photos: getProduceImages("Yam"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 4 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_005",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Sorghum",
                grade: "B",
                quantityKg: 3500,
                pricePerKg: 380,
                photos: getProduceImages("Sorghum"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 2 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_006",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Maize",
                grade: "B",
                quantityKg: 6000,
                pricePerKg: 420,
                photos: getProduceImages("Maize"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 1 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_007",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Rice",
                grade: "A",
                quantityKg: 4500,
                pricePerKg: 920,
                photos: getProduceImages("Rice"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 6 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_008",
                farmerId: farmerId,
                farmerName: "Adamu Bello",
                commodity: "Yam",
                grade: "A",
                quantityKg: 3500,
                pricePerKg: 520,
                photos: getProduceImages("Yam"),
                locationLabel: "Zaria Farm Settlement",
                region: "Kaduna",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 8 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_009",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Cassava",
                grade: "A",
                quantityKg: 5000,
                pricePerKg: 300,
                photos: getProduceImages("Cassava"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 9 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_010",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Maize",
                grade: "A",
                quantityKg: 7000,
                pricePerKg: 480,
                photos: getProduceImages("Maize"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 10 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_011",
                farmerId: farmerId,
                farmerName: "Adamu Bello",
                commodity: "Sorghum",
                grade: "B",
                quantityKg: 4000,
                pricePerKg: 400,
                photos: getProduceImages("Sorghum"),
                locationLabel: "Kano River Project",
                region: "Kano",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 11 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            // Additional listings with different grades for all 6 produce types
            {
                id: "listing_012",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Tomatoes",
                grade: "A",
                quantityKg: 2000,
                pricePerKg: 650,
                photos: getProduceImages("Tomatoes"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 12 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_013",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Tomatoes",
                grade: "B",
                quantityKg: 1800,
                pricePerKg: 580,
                photos: getProduceImages("Tomatoes"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 13 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_014",
                farmerId: farmerId,
                farmerName: "Adamu Bello",
                commodity: "Rice",
                grade: "C",
                quantityKg: 3000,
                pricePerKg: 750,
                photos: getProduceImages("Rice"),
                locationLabel: "Zaria Farm Settlement",
                region: "Kaduna",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 14 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_015",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Yam",
                grade: "B",
                quantityKg: 2200,
                pricePerKg: 500,
                photos: getProduceImages("Yam"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 15 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_016",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Cassava",
                grade: "C",
                quantityKg: 2800,
                pricePerKg: 250,
                photos: getProduceImages("Cassava"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 16 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_017",
                farmerId: farmerId,
                farmerName: "Adamu Bello",
                commodity: "Maize",
                grade: "C",
                quantityKg: 5500,
                pricePerKg: 400,
                photos: getProduceImages("Maize"),
                locationLabel: "Kano River Project",
                region: "Kano",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 17 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_018",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Sorghum",
                grade: "A",
                quantityKg: 4500,
                pricePerKg: 450,
                photos: getProduceImages("Sorghum"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 18 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_019",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Tomatoes",
                grade: "C",
                quantityKg: 1500,
                pricePerKg: 520,
                photos: getProduceImages("Tomatoes"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 19 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_020",
                farmerId: farmerId,
                farmerName: "Adamu Bello",
                commodity: "Yam",
                grade: "C",
                quantityKg: 2000,
                pricePerKg: 480,
                photos: getProduceImages("Yam"),
                locationLabel: "Zaria Farm Settlement",
                region: "Kaduna",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 20 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            // More listings to ensure plenty of produce is visible
            {
                id: "listing_021",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Maize",
                grade: "A",
                quantityKg: 8000,
                pricePerKg: 460,
                photos: getProduceImages("Maize"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 1 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_022",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Rice",
                grade: "B",
                quantityKg: 5000,
                pricePerKg: 800,
                photos: getProduceImages("Rice"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 2 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_023",
                farmerId: farmerId,
                farmerName: "Adamu Bello",
                commodity: "Cassava",
                grade: "A",
                quantityKg: 6000,
                pricePerKg: 320,
                photos: getProduceImages("Cassava"),
                locationLabel: "Kano River Project",
                region: "Kano",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 3 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_024",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Yam",
                grade: "A",
                quantityKg: 4000,
                pricePerKg: 580,
                photos: getProduceImages("Yam"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 4 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_025",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Sorghum",
                grade: "A",
                quantityKg: 5500,
                pricePerKg: 420,
                photos: getProduceImages("Sorghum"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 5 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_026",
                farmerId: farmerId,
                farmerName: "Adamu Bello",
                commodity: "Tomatoes",
                grade: "B",
                quantityKg: 2500,
                pricePerKg: 600,
                photos: getProduceImages("Tomatoes"),
                locationLabel: "Zaria Farm Settlement",
                region: "Kaduna",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 6 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_027",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Maize",
                grade: "B",
                quantityKg: 7500,
                pricePerKg: 410,
                photos: getProduceImages("Maize"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 7 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_028",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Rice",
                grade: "A",
                quantityKg: 6000,
                pricePerKg: 950,
                photos: getProduceImages("Rice"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 8 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_029",
                farmerId: farmerId,
                farmerName: "Adamu Bello",
                commodity: "Cassava",
                grade: "B",
                quantityKg: 4500,
                pricePerKg: 270,
                photos: getProduceImages("Cassava"),
                locationLabel: "Kano River Project",
                region: "Kano",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 9 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_030",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Yam",
                grade: "B",
                quantityKg: 3200,
                pricePerKg: 510,
                photos: getProduceImages("Yam"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 10 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_031",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Sorghum",
                grade: "C",
                quantityKg: 3800,
                pricePerKg: 360,
                photos: getProduceImages("Sorghum"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 11 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_032",
                farmerId: farmerId,
                farmerName: "Adamu Bello",
                commodity: "Tomatoes",
                grade: "A",
                quantityKg: 3000,
                pricePerKg: 680,
                photos: getProduceImages("Tomatoes"),
                locationLabel: "Zaria Farm Settlement",
                region: "Kaduna",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 12 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_033",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Maize",
                grade: "C",
                quantityKg: 6500,
                pricePerKg: 390,
                photos: getProduceImages("Maize"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 13 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_034",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Rice",
                grade: "C",
                quantityKg: 4200,
                pricePerKg: 720,
                photos: getProduceImages("Rice"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 14 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_035",
                farmerId: farmerId,
                farmerName: "Adamu Bello",
                commodity: "Cassava",
                grade: "A",
                quantityKg: 7000,
                pricePerKg: 310,
                photos: getProduceImages("Cassava"),
                locationLabel: "Kano River Project",
                region: "Kano",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 15 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_036",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Yam",
                grade: "A",
                quantityKg: 4800,
                pricePerKg: 560,
                photos: getProduceImages("Yam"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 16 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_037",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Sorghum",
                grade: "B",
                quantityKg: 5000,
                pricePerKg: 390,
                photos: getProduceImages("Sorghum"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 17 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_038",
                farmerId: farmerId,
                farmerName: "Adamu Bello",
                commodity: "Tomatoes",
                grade: "B",
                quantityKg: 2200,
                pricePerKg: 590,
                photos: getProduceImages("Tomatoes"),
                locationLabel: "Zaria Farm Settlement",
                region: "Kaduna",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 18 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_039",
                farmerId: farmerId2,
                farmerName: "Hassan Musa",
                commodity: "Maize",
                grade: "A",
                quantityKg: 9000,
                pricePerKg: 470,
                photos: getProduceImages("Maize"),
                locationLabel: "Benue Valley Farm",
                region: "Benue",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 19 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "listing_040",
                farmerId: farmerId3,
                farmerName: "Amina Usman",
                commodity: "Rice",
                grade: "B",
                quantityKg: 5500,
                pricePerKg: 830,
                photos: getProduceImages("Rice"),
                locationLabel: "Sokoto Grain Farm",
                region: "Sokoto",
                status: "Active",
                createdAt: new Date(
                    Date.now() - 20 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
        ],
        orders: [
            {
                id: "order_001",
                buyerId,
                buyerName: "Ngozi Okonkwo",
                farmerId,
                farmerName: "Adamu Bello",
                listingId: "listing_001",
                commodity: "Maize",
                quantityKg: 2000,
                pricePerKg: 450,
                amount: 900000,
                status: "Pending",
                pickupLocation: "Zaria Farm Settlement, Kaduna",
                createdAt: new Date(
                    Date.now() - 2 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "order_002",
                buyerId,
                buyerName: "Ngozi Okonkwo",
                farmerId,
                farmerName: "Adamu Bello",
                listingId: "listing_002",
                commodity: "Cassava",
                quantityKg: 1500,
                pricePerKg: 280,
                amount: 420000,
                status: "Accepted",
                pickupLocation: "Zaria Farm Settlement, Kaduna",
                createdAt: new Date(
                    Date.now() - 24 * 60 * 60 * 1000,
                ).toISOString(),
                acceptedAt: new Date(
                    Date.now() - 20 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "order_003",
                buyerId,
                buyerName: "Ngozi Okonkwo",
                farmerId,
                farmerName: "Adamu Bello",
                listingId: "listing_001",
                commodity: "Maize",
                quantityKg: 1000,
                pricePerKg: 450,
                amount: 450000,
                status: "Delivered",
                pickupLocation: "Zaria Farm Settlement, Kaduna",
                createdAt: new Date(
                    Date.now() - 7 * 24 * 60 * 60 * 1000,
                ).toISOString(),
                acceptedAt: new Date(
                    Date.now() - 6 * 24 * 60 * 60 * 1000,
                ).toISOString(),
                deliveredAt: new Date(
                    Date.now() - 4 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
        ],
        transactions: [
            {
                id: "txn_001",
                userId: farmerId,
                type: "Credit",
                title: "Payment for Maize (Order #003)",
                amount: 450000,
                createdAt: new Date(
                    Date.now() - 4 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "txn_002",
                userId: farmerId,
                type: "Debit",
                title: "Withdrawal to GTBank",
                amount: 200000,
                createdAt: new Date(
                    Date.now() - 3 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
            {
                id: "txn_003",
                userId: farmerId,
                type: "Credit",
                title: "Payment for Cassava (Order #002)",
                amount: 420000,
                createdAt: new Date(
                    Date.now() - 1 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
        ],
        withdrawals: [
            {
                id: "wd_001",
                userId: farmerId,
                amount: 200000,
                bankName: "GTBank",
                accountMasked: "****4521",
                status: "Paid",
                createdAt: new Date(
                    Date.now() - 3 * 24 * 60 * 60 * 1000,
                ).toISOString(),
            },
        ],
        marketPrices: [
            {
                commodity: "Maize",
                regionalPricePerKg: 420,
                lastUpdated: new Date().toISOString(),
            },
            {
                commodity: "Cassava",
                regionalPricePerKg: 300,
                lastUpdated: new Date().toISOString(),
            },
            {
                commodity: "Rice",
                regionalPricePerKg: 850,
                lastUpdated: new Date().toISOString(),
            },
            {
                commodity: "Yam",
                regionalPricePerKg: 550,
                lastUpdated: new Date().toISOString(),
            },
            {
                commodity: "Sorghum",
                regionalPricePerKg: 380,
                lastUpdated: new Date().toISOString(),
            },
        ],
        kycData: [
            // No KYC data initially - farmers start with NOT_STARTED status
        ],
        disputes: [
            // No disputes initially
        ],
        escrows: [],
        platformCommission: 0,
    };
};

// Get app state from localStorage
export const getAppState = (): AppState => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const state = JSON.parse(stored);
            // Ensure all required properties exist (migration for old data)
            if (!state.disputes) {
                state.disputes = [];
            }

            // Merge seed listings with existing listings to ensure all produce is available
            const seedData = createSeedData();
            const existingListingIds = new Set(
                state.listings.map((l: Listing) => l.id),
            );

            // Add any seed listings that don't exist in current state
            seedData.listings.forEach((seedListing) => {
                if (!existingListingIds.has(seedListing.id)) {
                    state.listings.push(seedListing);
                }
            });

            // Ensure listings are sorted by creation date (newest first)
            state.listings.sort(
                (a: Listing, b: Listing) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            );

            setAppState(state);
            return state;
        }
    } catch (e) {
        console.error("Error reading state:", e);
    }
    const seedData = createSeedData();
    setAppState(seedData);
    return seedData;
};

// Set app state to localStorage
export const setAppState = (state: AppState): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Error saving state:", e);
    }
};

// Reset app state to seed data
export const resetAppState = (): AppState => {
    const seedData = createSeedData();
    setAppState(seedData);
    return seedData;
};

// Force refresh listings - ensures all seed listings are available
export const refreshListings = (): AppState => {
    const state = getAppState();
    const seedData = createSeedData();
    const existingListingIds = new Set(
        state.listings.map((l: Listing) => l.id),
    );

    // Add any seed listings that don't exist
    seedData.listings.forEach((seedListing) => {
        if (!existingListingIds.has(seedListing.id)) {
            state.listings.push(seedListing);
        }
    });

    // Sort by creation date
    state.listings.sort(
        (a: Listing, b: Listing) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    setAppState(state);
    return state;
};

// Escrow helpers for local mode
export const createEscrow = (
    orderId: string,
    buyerId: string,
    farmerId: string,
    amount: number,
): Escrow => {
    const state = getAppState();
    const commission = amount * PLATFORM_COMMISSION_RATE;
    const farmerAmount = amount - commission;
    const escrow: Escrow = {
        id: `escrow_${generateId()}`,
        orderId,
        buyerId,
        farmerId,
        amount,
        commission,
        farmerAmount,
        status: "held",
        createdAt: new Date().toISOString(),
    };

    state.escrows.push(escrow);

    const buyerWallet = state.wallets.find((w) => w.userId === buyerId);
    if (buyerWallet) {
        buyerWallet.locked = (buyerWallet.locked || 0) + amount;
        buyerWallet.available -= amount;
    } else {
        state.wallets.push({
            userId: buyerId,
            available: 0,
            pending: 0,
            locked: amount,
            currency: "₦",
        });
    }

    setAppState(state);
    return escrow;
};

export const releaseEscrow = (orderId: string): void => {
    const state = getAppState();
    const escrow = state.escrows.find(
        (e) => e.orderId === orderId && e.status === "held",
    );
    if (!escrow) return;

    escrow.status = "released";
    escrow.releasedAt = new Date().toISOString();
    state.platformCommission =
        (state.platformCommission || 0) + escrow.commission;

    const buyerWallet = state.wallets.find((w) => w.userId === escrow.buyerId);
    if (buyerWallet) {
        buyerWallet.locked = Math.max(
            0,
            (buyerWallet.locked || 0) - escrow.amount,
        );
    }

    const farmerWallet = state.wallets.find(
        (w) => w.userId === escrow.farmerId,
    );
    if (farmerWallet) {
        farmerWallet.available += escrow.farmerAmount;
    } else {
        state.wallets.push({
            userId: escrow.farmerId,
            available: escrow.farmerAmount,
            pending: 0,
            locked: 0,
            currency: "₦",
            withdrawn: 0,
        });
    }

    addTransaction(
        escrow.farmerId,
        "Credit",
        `Escrow released: Order ${orderId}`,
        escrow.farmerAmount,
        "completed",
        undefined,
        orderId,
    );
    addTransaction(
        escrow.farmerId,
        "commission",
        `Platform commission: Order ${orderId}`,
        -escrow.commission,
        "completed",
        undefined,
        orderId,
    );

    setAppState(state);
};

export const refundEscrow = (orderId: string, reason?: string): void => {
    const state = getAppState();
    const escrow = state.escrows.find(
        (e) => e.orderId === orderId && e.status === "held",
    );
    if (!escrow) return;

    escrow.status = "refunded";
    escrow.refundedAt = new Date().toISOString();

    const buyerWallet = state.wallets.find((w) => w.userId === escrow.buyerId);
    if (buyerWallet) {
        buyerWallet.locked = Math.max(
            0,
            (buyerWallet.locked || 0) - escrow.amount,
        );
        buyerWallet.available += escrow.amount;
    }

    addTransaction(
        escrow.buyerId,
        "refund",
        `Refund: Order ${orderId}${reason ? ` - ${reason}` : ""}`,
        escrow.amount,
        "completed",
        undefined,
        orderId,
    );
    setAppState(state);
};

// Update partial state
export const updateAppState = (updates: Partial<AppState>): AppState => {
    const current = getAppState();
    const newState = { ...current, ...updates };
    setAppState(newState);
    return newState;
};

// Helper: Get wallet by user ID
export const getWalletByUserId = (userId: string): Wallet | undefined => {
    const state = getAppState();
    return state.wallets.find((w) => w.userId === userId);
};

// Helper: Get listings by farmer ID
export const getListingsByFarmerId = (farmerId: string): Listing[] => {
    const state = getAppState();
    return state.listings.filter((l) => l.farmerId === farmerId);
};

// Helper: Get orders by farmer ID
export const getOrdersByFarmerId = (farmerId: string): Order[] => {
    const state = getAppState();
    return state.orders.filter((o) => o.farmerId === farmerId);
};

// Helper: Get orders by buyer ID
export const getOrdersByBuyerId = (buyerId: string): Order[] => {
    const state = getAppState();
    return state.orders.filter((o) => o.buyerId === buyerId);
};

// Helper: Get transactions by user ID
export const getTransactionsByUserId = (userId: string): Transaction[] => {
    const state = getAppState();
    return state.transactions.filter((t) => t.userId === userId);
};

// Helper: Get withdrawals by user ID
export const getWithdrawalsByUserId = (
    userId: string,
): import("@/types").Withdrawal[] => {
    const state = getAppState();
    return state.withdrawals.filter((w) => w.userId === userId);
};

// Helper: Get KYC data by user ID
export const getKYCByUserId = (userId: string): KYCData | undefined => {
    const state = getAppState();
    return state.kycData.find((k) => k.userId === userId);
};

// Helper: Add new listing
export const addListing = (
    listing: Omit<Listing, "id" | "createdAt">,
): Listing => {
    // Auto-assign images if photos array is empty
    const photos =
        listing.photos && listing.photos.length > 0
            ? listing.photos
            : getProduceImages(listing.commodity);
    const state = getAppState();
    const newListing: Listing = {
        ...listing,
        photos,
        id: `listing_${generateId()}`,
        createdAt: new Date().toISOString(),
    };
    state.listings.unshift(newListing);
    setAppState(state);
    return newListing;
};

// Helper: Update listing
export const updateListing = (
    listingId: string,
    updates: Partial<Listing>,
): void => {
    const state = getAppState();
    const index = state.listings.findIndex((l) => l.id === listingId);
    if (index !== -1) {
        state.listings[index] = { ...state.listings[index], ...updates };
        setAppState(state);
    }
};

// Helper: Delete listing
export const deleteListing = (listingId: string): void => {
    const state = getAppState();
    state.listings = state.listings.filter((l) => l.id !== listingId);
    setAppState(state);
};

// Helper: Get Nigerian city coordinates (lazy import to avoid circular dependency)
const getCityCoords = (cityName: string): { lat: number; lng: number } => {
    const cities: Record<string, { lat: number; lng: number }> = {
        Lagos: { lat: 6.5244, lng: 3.3792 },
        Abuja: { lat: 9.0765, lng: 7.3986 },
        Kano: { lat: 12.0022, lng: 8.5919 },
        Kaduna: { lat: 10.5264, lng: 7.4383 },
        PortHarcourt: { lat: 4.8156, lng: 7.0498 },
        Ibadan: { lat: 7.3776, lng: 3.947 },
        Benin: { lat: 6.335, lng: 5.6037 },
        Enugu: { lat: 6.4474, lng: 7.5139 },
        Zaria: { lat: 11.1112, lng: 7.7227 },
        Sokoto: { lat: 13.0627, lng: 5.2433 },
        Benue: { lat: 7.3369, lng: 8.7404 },
        Ekiti: { lat: 7.6233, lng: 5.2209 },
        Kogi: { lat: 7.8023, lng: 6.7439 },
        Kwara: { lat: 8.5, lng: 4.55 },
        Osun: { lat: 7.75, lng: 4.5667 },
    };

    const normalized = cityName.toLowerCase();
    for (const [key, value] of Object.entries(cities)) {
        if (key.toLowerCase() === normalized) {
            return value;
        }
    }
    return cities.Lagos; // Default
};

// Helper: Add new order with location and tracking data
export const addOrder = (
    order: Omit<
        Order,
        | "id"
        | "createdAt"
        | "buyerLocation"
        | "farmerLocation"
        | "deliveryLocation"
        | "tracking"
    >,
): Order => {
    const state = getAppState();

    const listing = state.listings.find((l) => l.id === order.listingId);
    const buyer = state.buyers.find((b) => b.id === order.buyerId);
    const farmer = state.farmers.find((f) => f.id === order.farmerId);

    // Set locations based on regions
    const farmerLocation = getCityCoords(
        listing?.region || order.pickupLocation || farmer?.region || "Lagos",
    );
    const buyerLocation = getCityCoords(buyer?.region || "Lagos");
    const deliveryLocation = buyerLocation; // Delivery goes to buyer's location

    // Initialize tracking data with new structure
    const tracking: OrderTracking = {
        pickup: farmerLocation,
        dropoff: deliveryLocation,
        current: farmerLocation, // Start at pickup
        isTracking: false,
        progressPct: 0,
        // Legacy fields for backward compatibility
        currentLocation: null,
        route: [],
        progressPercentage: 0,
    };

    const newOrder: Order = {
        ...order,
        id: `order_${generateId()}`,
        createdAt: new Date().toISOString(),
        buyerLocation,
        farmerLocation,
        deliveryLocation,
        tracking,
    };

    // Add order
    state.orders.unshift(newOrder);

    // Update buyer wallet: move amount from available to pending (payment held)
    const buyerWallet = state.wallets.find((w) => w.userId === order.buyerId);
    if (buyerWallet && buyerWallet.available >= order.amount) {
        buyerWallet.available -= order.amount;
        buyerWallet.pending += order.amount;

        // Add debit transaction for buyer
        addTransaction(
            order.buyerId,
            "Debit",
            `Order payment: ${order.commodity}`,
            order.amount,
        );
    }

    setAppState(state);

    // Dispatch custom event to notify all components of new order
    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent("farmsquare:order-created", {
                detail: {
                    order: newOrder,
                    farmerId: order.farmerId,
                    buyerId: order.buyerId,
                },
            }),
        );
        window.dispatchEvent(new CustomEvent("farmsquare:state-changed"));
    }

    return newOrder;
};

// Helper: Update order status
export const updateOrderStatus = (
    orderId: string,
    status: import("@/types").OrderStatus,
    evidence?: import("@/types").OrderEvidence,
): void => {
    const state = getAppState();
    const index = state.orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
        const now = new Date().toISOString();
        const order = state.orders[index];
        const previousStatus = order.status;

        // Initialize tracking when order goes in transit
        let tracking = order.tracking;
        if (
            status === "InTransit" &&
            order.farmerLocation &&
            order.deliveryLocation
        ) {
            // Initialize tracking with starting location
            tracking = {
                currentLocation: order.farmerLocation,
                route: [], // Will be populated by tracking service
                progressPercentage: 0,
            };

            // Trigger tracking service to start (if available)
            if (typeof window !== "undefined") {
                // Dispatch event for tracking service
                setTimeout(() => {
                    window.dispatchEvent(
                        new CustomEvent("farmsquare:order-in-transit", {
                            detail: { orderId: order.id },
                        }),
                    );
                }, 100);
            }
        } else if (status === "Delivered" && tracking) {
            // Mark as complete when delivered
            tracking = {
                ...tracking,
                currentLocation:
                    order.deliveryLocation || tracking.currentLocation,
                progressPercentage: 100,
            };

            // Stop tracking when delivered
            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("farmsquare:order-delivered", {
                        detail: { orderId: order.id },
                    }),
                );
            }
        }

        state.orders[index] = {
            ...order,
            status,
            ...(status === "Accepted" && { acceptedAt: now }),
            ...(status === "Processing" && { processingAt: now }),
            ...(status === "PickupScheduled" && { pickupScheduledAt: now }),
            ...(status === "InTransit" && { inTransitAt: now }),
            ...(status === "Delivered" && { deliveredAt: now }),
            ...(evidence && { evidence }),
            ...(tracking && { tracking }),
        };

        // Handle wallet updates and quantity locking based on status changes
        if (status === "Accepted" && previousStatus === "Pending") {
            // Order accepted - lock listing quantity (prevent further orders on this quantity)
            const listing = state.listings.find(
                (l) => l.id === order.listingId,
            );
            if (listing) {
                // Quantity is already reduced when order is placed, but we mark it as locked
                // This prevents editing quantity while order is active
            }
        } else if (status === "Delivered" && previousStatus !== "Delivered") {
            // Order delivered - release escrow and update wallet balances
            releaseEscrow(order.id);
        } else if (status === "Rejected" && previousStatus !== "Pending") {
            // Order rejected after payment - refund escrow and restore listing quantity
            refundEscrow(order.id, `Order ${order.id} rejected`);

            const listing = state.listings.find(
                (l) => l.id === order.listingId,
            );
            if (listing) {
                listing.quantityKg += order.quantityKg;
                if (listing.status === "Sold" && listing.quantityKg > 0) {
                    listing.status = "Active";
                }
            }
        }

        setAppState(state);
    }
};

// Helper: Add transaction
export const addTransaction = (
    userId: string,
    type: import("@/types").TransactionType,
    title: string,
    amount: number,
    status: import("@/types").TransactionStatus = "completed",
    reference?: string,
    orderId?: string,
    metadata?: Record<string, any>,
): void => {
    const state = getAppState();
    const newTransaction: Transaction = {
        id: `txn_${generateId()}`,
        userId,
        type,
        title,
        amount,
        createdAt: new Date().toISOString(),
        status,
        reference,
        orderId,
        metadata,
    };
    state.transactions.unshift(newTransaction);
    setAppState(state);
};

// Helper: Add withdrawal request
export const addWithdrawal = (
    userId: string,
    amount: number,
    bankName: string,
    accountMasked: string,
): void => {
    const state = getAppState();

    // Reduce available balance
    const walletIndex = state.wallets.findIndex((w) => w.userId === userId);
    if (walletIndex !== -1) {
        state.wallets[walletIndex].available -= amount;
    }

    // Add withdrawal record
    const newWithdrawal: import("@/types").Withdrawal = {
        id: `wd_${generateId()}`,
        userId,
        amount,
        bankName,
        accountMasked,
        status: "Submitted",
        createdAt: new Date().toISOString(),
    };
    state.withdrawals.unshift(newWithdrawal);

    // Add debit transaction
    const newTransaction: Transaction = {
        id: `txn_${generateId()}`,
        userId,
        type: "Debit",
        title: `Withdrawal to ${bankName}`,
        amount,
        createdAt: new Date().toISOString(),
    };
    state.transactions.unshift(newTransaction);

    setAppState(state);
};

// Helper: Confirm delivery (buyer confirms receipt, moves funds from farmer pending to available)
export const confirmDelivery = (orderId: string): void => {
    const state = getAppState();
    const order = state.orders.find((o) => o.id === orderId);

    if (!order || order.status !== "Delivered") {
        return; // Can only confirm delivered orders
    }

    const farmerWallet = state.wallets.find((w) => w.userId === order.farmerId);
    if (farmerWallet && farmerWallet.pending >= order.amount) {
        // Move from pending to available
        farmerWallet.pending -= order.amount;
        farmerWallet.available += order.amount;

        // Add transaction
        addTransaction(
            order.farmerId,
            "Credit",
            `Payment confirmed: ${order.commodity}`,
            order.amount,
        );

        setAppState(state);
    }
};

// Helper: Update KYC status (legacy function for backward compatibility)
export const updateKYCStatus = (
    userId: string,
    status: import("@/types").KYCStatus,
    rejectionReason?: string,
): void => {
    const state = getAppState();
    const index = state.kycData.findIndex((k) => k.userId === userId);

    const existingData = index !== -1 ? state.kycData[index] : null;

    const kycRecord: KYCData = {
        userId,
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
        selfieFile: existingData?.selfieFile,
        idDocumentFile: existingData?.idDocumentFile,
        submittedAt:
            status === "IN_REVIEW" || status === "APPROVED"
                ? new Date().toISOString()
                : existingData?.submittedAt,
        // Preserve existing data
        fullName: existingData?.fullName,
        phoneNumber: existingData?.phoneNumber,
        dateOfBirth: existingData?.dateOfBirth,
        address: existingData?.address,
        idType: existingData?.idType,
        idNumber: existingData?.idNumber,
        // Preserve business data (for buyers - KYB)
        businessName: existingData?.businessName,
        businessType: existingData?.businessType,
        businessRegistrationNumber: existingData?.businessRegistrationNumber,
        businessAddress: existingData?.businessAddress,
        businessEmail: existingData?.businessEmail,
        businessPhone: existingData?.businessPhone,
        businessDocumentFile: existingData?.businessDocumentFile,
        authorizedRepresentativeName:
            existingData?.authorizedRepresentativeName,
        authorizedRepresentativeRole:
            existingData?.authorizedRepresentativeRole,
        authorizedRepresentativeIdFile:
            existingData?.authorizedRepresentativeIdFile,
    };

    if (index !== -1) {
        state.kycData[index] = kycRecord;
    } else {
        state.kycData.push(kycRecord);
    }

    // Also update user's KYC status in farmers/buyers arrays and currentUser
    const farmerIndex = state.farmers.findIndex((f) => f.id === userId);
    if (farmerIndex !== -1) {
        state.farmers[farmerIndex].kycStatus = status;
    }

    // Also update buyer's KYC status if exists
    const buyerIndex = state.buyers.findIndex((b) => b.id === userId);
    if (buyerIndex !== -1) {
        state.buyers[buyerIndex].kycStatus = status;
    }

    // Update currentUser if it's the same user
    if (state.currentUser && state.currentUser.id === userId) {
        state.currentUser.kycStatus = status;
    }

    setAppState(state);
};

// Helper: Update full KYC data
export const updateKYCData = (
    userId: string,
    kycData: Partial<KYCData>,
): void => {
    const state = getAppState();
    const index = state.kycData.findIndex((k) => k.userId === userId);

    const existingData =
        index !== -1
            ? state.kycData[index]
            : { userId, status: "NOT_STARTED" as KYCStatus };

    const updatedRecord: KYCData = {
        ...existingData,
        ...kycData,
        userId, // Ensure userId is not overwritten
        submittedAt:
            kycData.status === "IN_REVIEW" || kycData.status === "APPROVED"
                ? kycData.submittedAt || new Date().toISOString()
                : existingData.submittedAt,
    };

    if (index !== -1) {
        state.kycData[index] = updatedRecord;
    } else {
        state.kycData.push(updatedRecord);
    }

    // Also update user's KYC status in farmers/buyers arrays and currentUser
    if (kycData.status) {
        const farmerIndex = state.farmers.findIndex((f) => f.id === userId);
        if (farmerIndex !== -1) {
            state.farmers[farmerIndex].kycStatus = kycData.status;
        }

        const buyerIndex = state.buyers.findIndex((b) => b.id === userId);
        if (buyerIndex !== -1) {
            state.buyers[buyerIndex].kycStatus = kycData.status;
        }

        // Update currentUser if it's the same user
        if (state.currentUser && state.currentUser.id === userId) {
            state.currentUser.kycStatus = kycData.status;
        }
    }

    setAppState(state);
};

// Format currency
export const formatNaira = (amount: number): string => {
    return `₦${amount.toLocaleString("en-NG")}`;
};

// Format date
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

// Format time ago
export const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
};

// Helper: Create a dispute
export const createDispute = (
    dispute: Omit<Dispute, "id" | "createdAt" | "updatedAt">,
): Dispute => {
    const state = getAppState();
    const newDispute: Dispute = {
        ...dispute,
        id: `dispute_${generateId()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    state.disputes.unshift(newDispute);
    setAppState(state);
    return newDispute;
};

// Helper: Get disputes by order ID
export const getDisputesByOrderId = (orderId: string): Dispute[] => {
    const state = getAppState();
    return state.disputes.filter((d) => d.orderId === orderId);
};

// Helper: Get all disputes
export const getAllDisputes = (): Dispute[] => {
    const state = getAppState();
    // Ensure disputes array exists
    if (!state.disputes) {
        state.disputes = [];
        setAppState(state);
    }
    return state.disputes || [];
};

// Helper: Update dispute status
export const updateDisputeStatus = (
    disputeId: string,
    status: DisputeStatus,
    resolution?: {
        resolvedBy: string;
        resolution: string;
        outcome: "buyer_favor" | "farmer_favor" | "partial" | "dismissed";
    },
): void => {
    const state = getAppState();
    const index = state.disputes.findIndex((d) => d.id === disputeId);

    if (index !== -1) {
        state.disputes[index].status = status;
        state.disputes[index].updatedAt = new Date().toISOString();

        if (resolution) {
            state.disputes[index].resolution = {
                ...resolution,
                resolvedAt: new Date().toISOString(),
            };
        }

        setAppState(state);
    }
};

// Fund buyer wallet via Paystack
export const fundBuyerWallet = (
    userId: string,
    amount: number,
    reference: string,
): void => {
    const state = getAppState();
    let buyerWallet = state.wallets.find((w) => w.userId === userId);

    if (!buyerWallet) {
        buyerWallet = {
            userId,
            available: 0,
            pending: 0,
            locked: 0,
            currency: "₦",
        };
        state.wallets.push(buyerWallet);
    }

    buyerWallet.available += amount;

    // Add transaction
    addTransaction(
        userId,
        "fund",
        `Wallet funding via Paystack`,
        amount,
        "completed",
        reference,
    );

    setAppState(state);
};
