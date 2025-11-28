import { getSubscriberByCpf } from "@/lib/queries";
import { DigitalCard } from "@/components/digital-card";
import { ExpiredCard } from "@/components/expired-card";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        cpf: string;
    }>;
}

export default async function CardPage({ params }: PageProps) {
    const { cpf } = await params;

    // Decode CPF if needed, but usually it's passed as is in URL
    // Ideally we might want to format it or strip chars before querying if the DB stores raw numbers
    // For now passing as is, assuming the query handles it or URL matches DB format

    interface Subscriber {
        name: string;
        cpf: string;
        next_due_date: string;
        plan_type: string;
    }

    const subscriber = await getSubscriberByCpf(cpf) as unknown as Subscriber;

    if (!subscriber) {
        notFound();
    }

    const nextDueDate = new Date(subscriber.next_due_date);
    const today = new Date();

    // Reset time part for accurate date comparison
    today.setHours(0, 0, 0, 0);
    nextDueDate.setHours(0, 0, 0, 0);

    const isExpired = nextDueDate < today;

    if (isExpired) {
        return <ExpiredCard />;
    }

    return <DigitalCard subscriber={subscriber} />;
}
