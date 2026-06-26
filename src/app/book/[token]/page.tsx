import BookingWidget from "./BookingWidget";

export default async function PublicBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <BookingWidget token={token} />;
}
