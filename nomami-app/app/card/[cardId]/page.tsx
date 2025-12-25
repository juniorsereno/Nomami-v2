import { getSubscriberByCardId } from "@/lib/queries";
import { DigitalCard } from "@/components/digital-card";
import { ExpiredCard } from "@/components/expired-card";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        cardId: string;
    }>;
}

export default async function CardPage({ params }: PageProps) {
    const { cardId } = await params;

    interface Subscriber {
        name: string;
        card_id: string;
        next_due_date: string;
        plan_type: string;
    }

    const subscriber = await getSubscriberByCardId(cardId.toUpperCase()) as unknown as Subscriber;

    if (!subscriber) {
        notFound();
    }

    const nextDueDate = new Date(subscriber.next_due_date);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    nextDueDate.setHours(0, 0, 0, 0);

    const isExpired = nextDueDate < today;

    if (isExpired) {
        return <ExpiredCard />;
    }

    return <DigitalCard subscriber={subscriber} />;
}
