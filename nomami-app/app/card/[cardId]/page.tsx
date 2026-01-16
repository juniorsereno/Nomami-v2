import { getSubscriberByCardId } from "@/lib/queries";
import { DigitalCard } from "@/components/digital-card";
import { ExpiredCard } from "@/components/expired-card";
import { AddToHomePrompt } from "@/components/add-to-home-prompt";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        cardId: string;
    }>;
}

interface Subscriber {
    name: string;
    card_id: string;
    next_due_date: string;
    plan_type: string;
    subscriber_type?: 'individual' | 'corporate';
    company_name?: string;
    company_id?: string;
    status?: string;
}

export default async function CardPage({ params }: PageProps) {
    const { cardId } = await params;

    const subscriber = await getSubscriberByCardId(cardId.toUpperCase()) as unknown as Subscriber;

    if (!subscriber) {
        notFound();
    }

    const isCorporate = subscriber.subscriber_type === 'corporate';
    const isInactive = subscriber.status === 'inativo';

    // For inactive corporate subscribers, show the digital card with inactive state
    // The DigitalCard component handles the inactive display
    if (isCorporate && isInactive) {
        return (
            <>
                <DigitalCard subscriber={subscriber} />
                <AddToHomePrompt />
            </>
        );
    }

    const nextDueDate = new Date(subscriber.next_due_date);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    nextDueDate.setHours(0, 0, 0, 0);

    const isExpired = nextDueDate < today;

    // For expired individual subscribers or expired corporate subscribers, show expired card
    if (isExpired) {
        return <ExpiredCard />;
    }

    return (
        <>
            <DigitalCard subscriber={subscriber} />
            <AddToHomePrompt />
        </>
    );
}
