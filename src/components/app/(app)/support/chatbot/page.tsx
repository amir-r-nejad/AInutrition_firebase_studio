import { SupportChat } from '@/components/SupportChat';
import { Card, CardContent } from '@/components/ui/card';
import SectionHeader from '@/components/ui/SectionHeader';
import { MessageSquareQuote } from 'lucide-react'; // Changed from MessageSquareQuestion

export default function ChatbotSupportPage() {
  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl'>
        <SectionHeader
          icon={<MessageSquareQuote className='h-8 w-8 text-primary' />}
          className='text-3xl font-bold'
          title='NutriPlan Support Chat'
          description='Have questions about how to use NutriPlan? Ask our support bot below! It can help you navigate features, understand tools, and make the most of your personalized nutrition journey.'
        />

        <CardContent>
          <SupportChat />
        </CardContent>
      </Card>
    </div>
  );
}
