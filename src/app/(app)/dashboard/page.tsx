
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  NotebookText,
  Target,
  User,
  BrainCircuit,
  SplitSquareHorizontal,
  ChefHat,
  HeartPulse,
} from 'lucide-react';
import Image from 'next/image';

const primaryFeatures = [
  {
    title: 'Your Profile',
    description:
      'Keep your health data and preferences up to date for the best recommendations.',
    icon: User,
    href: '/profile',
    cta: 'Go to Profile',
    variant: 'outline',
  },
  {
    title: 'Current Meal Plan',
    description:
      'View and manage your ongoing weekly meal schedule and track your progress.',
    icon: NotebookText,
    href: '/meal-plan/current',
    cta: 'View Current Plan',
    variant: 'outline',
  },
  {
    title: 'AI-Optimized Plan',
    description:
      'Let our AI generate a personalized meal plan tailored to your needs and goals.',
    icon: Bot,
    href: '/meal-plan/optimized',
    cta: 'Generate AI Plan',
    variant: 'default',
  },
  {
    title: 'Smart Planner',
    description:
      'Calculate and fine-tune your daily calorie and macronutrient targets.',
    icon: BrainCircuit,
    href: '/tools/smart-calorie-planner',
    cta: 'Open Planner',
    variant: 'secondary',
  },
];

const toolFeatures = [
  {
    title: 'Macro Splitter',
    description: 'Distribute your daily macros across different meals.',
    icon: SplitSquareHorizontal,
    href: '/tools/macro-splitter',
  },
  {
    title: 'Meal Suggestions',
    description: 'Get AI-powered meal ideas for specific macro targets.',
    icon: ChefHat,
    href: '/tools/meal-suggestions',
  },
];

export default function DashboardPage() {
  return (
    <div className='container mx-auto py-8 space-y-12'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold tracking-tight text-primary sm:text-5xl'>
          Welcome to NutriPlan!
        </h1>
        <p className='mt-4 text-lg leading-8 text-foreground/80'>
          Your personalized guide to healthier eating and achieving your
          fitness goals.
        </p>
      </div>

      <div>
        <h2 className='text-2xl font-semibold tracking-tight text-center mb-1'>
          Your Nutrition Hub
        </h2>
        <p className='text-center text-muted-foreground mb-6'>
          All the essential tools to manage your diet and progress.
        </p>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {primaryFeatures.map((feature) => (
            <Card
              key={feature.title}
              className='flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300'
            >
              <CardHeader className='flex-grow'>
                <feature.icon className='h-10 w-10 mb-3 text-accent' />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={feature.href} passHref>
                  <Button className='w-full' variant={feature.variant as any}>
                    {feature.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className='text-2xl font-semibold tracking-tight text-center mb-1'>
          Advanced Tools
        </h2>
        <p className='text-center text-muted-foreground mb-6'>
          Fine-tune your plan with these specialized tools.
        </p>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {toolFeatures.map((tool) => (
            <Card
              key={tool.title}
              className='shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center p-6'
            >
              <div className='mr-6'>
                <tool.icon className='h-12 w-12 text-primary' />
              </div>
              <div className='flex-grow'>
                <h3 className='text-xl font-semibold mb-1'>{tool.title}</h3>
                <p className='text-muted-foreground mb-4'>{tool.description}</p>
                <Link href={tool.href} passHref>
                  <Button variant='secondary'>
                    Open Tool <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
