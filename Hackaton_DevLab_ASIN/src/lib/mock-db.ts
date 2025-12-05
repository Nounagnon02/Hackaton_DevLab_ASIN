export type PaymentStatus = "NOT_PAID" | "AVAILABLE" | "WITHDRAWN";

export interface Pensioner {
  id: string;
  name: string;
  phoneNumber: string;
  monthlyPension: number;
  paymentStatus: PaymentStatus;
  fspId: string;
  lastWithdrawalDate?: Date;
}

// Initial mock data
export const pensioners: Pensioner[] = [
  {
    id: "1",
    name: "Jean Atchadé",
    phoneNumber: "22997000000",
    monthlyPension: 50000,
    paymentStatus: "NOT_PAID",
    fspId: "payeefsp",
  },
  {
    id: "2",
    name: "Marie Kossou",
    phoneNumber: "22961000000",
    monthlyPension: 45000,
    paymentStatus: "NOT_PAID",
    fspId: "payeefsp",
  },
  {
    id: "3",
    name: "Paul Hounkponou",
    phoneNumber: "22996000000",
    monthlyPension: 60000,
    paymentStatus: "NOT_PAID",
    fspId: "payeefsp",
  }
];

export const getPensioners = () => pensioners;

export const getPensionerById = (id: string) => {
  return pensioners.find((p) => p.id === id);
};

// Mark all as AVAILABLE after government bulk payment
// Only update those who haven't been paid yet (NOT_PAID)
export const markAllAsAvailable = () => {
  pensioners.forEach(p => {
    if (p.paymentStatus === "NOT_PAID") {
      p.paymentStatus = "AVAILABLE";
    }
  });
  return pensioners;
};

// Mark as WITHDRAWN after individual withdrawal
export const markAsWithdrawn = (id: string) => {
  const pensioner = pensioners.find((p) => p.id === id);
  if (pensioner && pensioner.paymentStatus === "AVAILABLE") {
    pensioner.paymentStatus = "WITHDRAWN";
    pensioner.lastWithdrawalDate = new Date();
    return true;
  }
  return false;
};

// Get pensioners ready to withdraw (status = AVAILABLE)
export const getAvailablePensioners = () => pensioners.filter((p) => p.paymentStatus === "AVAILABLE");

export const verifyPensioner = (id: string) => {
  return pensioners.some((p) => p.id === id);
};
