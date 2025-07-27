"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dumbbell,
  Heart,
  Target,
  Clock,
  MapPin,
  Utensils,
  TrendingUp,
  Activity,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Timer,
  Repeat,
  CheckCircle,
  Youtube,
  ArrowRight,
  Calendar,
  User,
  BarChart3,
} from "lucide-react";

const exercisePlannerSchema = z.object({
  fitness_level: z
    .enum(["Beginner", "Intermediate", "Advanced", ""])
    .refine((val) => val !== "", { message: "Please select a fitness level" }),
  exercise_experience: z.array(z.string()).optional(),
  exercise_experience_other: z.string().optional(),
  existing_medical_conditions: z.array(z.string()).optional(),
  existing_medical_conditions_other: z.string().optional(),
  injuries_or_limitations: z.string().optional(),
  current_medications: z.array(z.string()).optional(),
  current_medications_other: z.string().optional(),
  doctor_clearance: z.boolean(),
  primary_goal: z
    .enum([
      "Lose fat",
      "Build muscle",
      "Increase endurance",
      "Flexibility",
      "General fitness",
      "",
    ])
    .refine((val) => val !== "", { message: "Please select a primary goal" }),
  secondary_goal: z
    .enum([
      "Lose fat",
      "Build muscle",
      "Increase endurance",
      "Flexibility",
      "General fitness",
      "",
    ])
    .optional(),
  goal_timeline_weeks: z
    .number()
    .min(1, { message: "Timeline must be at least 1 week" })
    .max(52),
  target_weight_kg: z.number().min(30).max(300).or(z.literal(0)).optional(),
  muscle_groups_focus: z.array(z.string()).optional(),
  exercise_days_per_week: z
    .number()
    .min(1, { message: "Must exercise at least 1 day per week" })
    .max(7),
  available_time_per_session: z
    .number()
    .min(15, { message: "Session must be at least 15 minutes" })
    .max(180),
  preferred_time_of_day: z
    .enum(["Morning", "Afternoon", "Evening", ""])
    .refine((val) => val !== "", { message: "Please select preferred time" }),
  exercise_location: z
    .enum(["Home", "Gym", "Outdoor", ""])
    .refine((val) => val !== "", {
      message: "Please select exercise location",
    }),
  daily_step_count_avg: z
    .number()
    .min(0)
    .max(30000)
    .or(z.literal(0))
    .optional(),
  job_type: z
    .enum(["Desk job", "Active job", "Standing job", ""])
    .refine((val) => val !== "", { message: "Please select job type" }),
  available_equipment: z.array(z.string()).optional(),
  available_equipment_other: z.string().optional(),
  machines_access: z.boolean().optional(),
  space_availability: z
    .enum(["Small room", "Open area", "Gym space", ""])
    .refine((val) => val !== "", {
      message: "Please select space availability",
    }),
  want_to_track_progress: z.boolean(),
  weekly_checkins_enabled: z.boolean(),
  accountability_support: z.boolean(),
  preferred_difficulty_level: z
    .enum(["Low", "Medium", "High", ""])
    .refine((val) => val !== "", { message: "Please select difficulty level" }),
  sleep_quality: z
    .enum(["Poor", "Average", "Good", ""])
    .refine((val) => val !== "", { message: "Please select sleep quality" }),
});

type ExercisePlannerFormData = z.infer<typeof exercisePlannerSchema>;

const medicalConditions = [
  "Asthma",
  "Hypertension",
  "Joint Issues",
  "Heart Disease",
  "Diabetes",
  "Arthritis",
  "Back Problems",
  "None",
  "Other",
];

const exerciseExperiences = [
  "Weightlifting",
  "Cardio",
  "HIIT",
  "Yoga",
  "Pilates",
  "Running",
  "Swimming",
  "Cycling",
  "None",
  "Other",
];

const commonMedications = [
  "Blood Pressure Medications",
  "Diabetes Medications",
  "Heart Medications",
  "Asthma Inhalers",
  "Pain Relievers",
  "Anti-inflammatories",
  "Antidepressants",
  "Thyroid Medications",
  "None",
  "Other",
];

const muscleGroups = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Glutes",
  "Full Body",
];

const equipmentOptions = [
  "Dumbbells",
  "Resistance Bands",
  "Barbell",
  "Yoga Mat",
  "Pull-up Bar",
  "Kettlebells",
  "Treadmill",
  "None",
  "Other",
];

export default function ExercisePlannerPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [expandedExercises, setExpandedExercises] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>(
    {},
  );

  useEffect(() => {
    const savedPlan = localStorage.getItem("generatedExercisePlan");
    if (savedPlan) {
      try {
        const parsedPlan = JSON.parse(savedPlan);
        setGeneratedPlan(parsedPlan);
        if (parsedPlan.weeklyPlan && typeof parsedPlan.weeklyPlan === 'object') {
          const allDays = Object.keys(parsedPlan.weeklyPlan);
          const expandedDaysObject = allDays.reduce(
            (acc, day) => {
              acc[day] = true;
              return acc;
            },
            {} as { [key: string]: boolean },
          );
          setExpandedDays(expandedDaysObject);
        }
      } catch (error) {
        console.error("Error parsing saved exercise plan:", error);
        localStorage.removeItem("generatedExercisePlan");
      }
    }
  }, []);

  const form = useForm<ExercisePlannerFormData>({
    resolver: zodResolver(exercisePlannerSchema),
    defaultValues: {
      fitness_level: undefined,
      exercise_experience: [],
      exercise_experience_other: "",
      existing_medical_conditions: [],
      existing_medical_conditions_other: "",
      injuries_or_limitations: "",
      current_medications: [],
      current_medications_other: "",
      doctor_clearance: false,
      primary_goal: undefined,
      secondary_goal: "",
      goal_timeline_weeks: 1,
      target_weight_kg: 0,
      muscle_groups_focus: [],
      exercise_days_per_week: 1,
      available_time_per_session: 15,
      preferred_time_of_day: undefined,
      exercise_location: undefined,
      daily_step_count_avg: 0,
      job_type: undefined,
      available_equipment: [],
      available_equipment_other: "",
      machines_access: false,
      space_availability: undefined,
      want_to_track_progress: true,
      weekly_checkins_enabled: true,
      accountability_support: true,
      preferred_difficulty_level: undefined,
      sleep_quality: undefined,
    },
    mode: "onChange",
  });

  const toggleExerciseExpansion = (exerciseKey: string) => {
    setExpandedExercises((prev) => ({
      ...prev,
      [exerciseKey]: !prev[exerciseKey],
    }));
  };

  const toggleDayExpansion = (dayKey: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const loadSavedPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/exercise-planner/get-preferences", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const savedData = result.data;
          form.reset({
            fitness_level: savedData.fitness_level || undefined,
            exercise_experience: savedData.exercise_experience || [],
            exercise_experience_other:
              savedData.exercise_experience_other || "",
            existing_medical_conditions:
              savedData.existing_medical_conditions || [],
            existing_medical_conditions_other:
              savedData.existing_medical_conditions_other || "",
            injuries_or_limitations: savedData.injuries_or_limitations || "",
            current_medications: savedData.current_medications || [],
            current_medications_other:
              savedData.current_medications_other || "",
            doctor_clearance: savedData.doctor_clearance || false,
            primary_goal: savedData.primary_goal || undefined,
            secondary_goal: savedData.secondary_goal || "",
            goal_timeline_weeks: savedData.goal_timeline_weeks || 1,
            target_weight_kg: savedData.target_weight_kg || 0,
            muscle_groups_focus: savedData.muscle_groups_focus || [],
            exercise_days_per_week: savedData.exercise_days_per_week || 1,
            available_time_per_session:
              savedData.available_time_per_session || 15,
            preferred_time_of_day: savedData.preferred_time_of_day || undefined,
            exercise_location: savedData.exercise_location || undefined,
            daily_step_count_avg: savedData.daily_step_count_avg || 0,
            job_type: savedData.job_type || undefined,
            available_equipment: savedData.available_equipment || [],
            available_equipment_other:
              savedData.available_equipment_other || "",
            machines_access: savedData.machines_access || false,
            space_availability: savedData.space_availability || undefined,
            want_to_track_progress: savedData.want_to_track_progress ?? true,
            weekly_checkins_enabled: savedData.weekly_checkins_enabled ?? true,
            accountability_support: savedData.accountability_support ?? true,
            preferred_difficulty_level:
              savedData.preferred_difficulty_level || undefined,
            sleep_quality: savedData.sleep_quality || undefined,
          });
          console.log("Loaded saved preferences:", savedData);
        }
      }
    } catch (error) {
      console.error("Error loading saved preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedPreferences();
  }, []);

  const selectedExerciseExperience = form.watch("exercise_experience") || [];
  const selectedMedicalConditions =
    form.watch("existing_medical_conditions") || [];
  const selectedEquipment = form.watch("available_equipment") || [];
  const selectedMedications = form.watch("current_medications") || [];

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const data = form.getValues();
      const cleanedData = {
        ...data,
        target_weight_kg: data.target_weight_kg || null,
        daily_step_count_avg: data.daily_step_count_avg || null,
        secondary_goal: data.secondary_goal || null,
        exercise_experience_other: data.exercise_experience_other || null,
        existing_medical_conditions_other:
          data.existing_medical_conditions_other || null,
        injuries_or_limitations: data.injuries_or_limitations || null,
        current_medications_other: data.current_medications_other || null,
        available_equipment_other: data.available_equipment_other || null,
      };

      console.log("Saving preferences:", cleanedData);

      const response = await fetch("/api/exercise-planner/save-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();
      console.log(
        "Response status:",
        response.status,
        "Response data:",
        result,
      );

      if (!response.ok) {
        console.error("Server error response:", result);
        const errorMessage =
          result.details || result.error || "Failed to save preferences";
        throw new Error(errorMessage);
      }

      console.log("Preferences saved successfully:", result);
      alert("Preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert(
        `Error saving preferences: ${error instanceof Error ? error.message : "Please try again."}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: ExercisePlannerFormData) => {
    setIsGenerating(true);
    try {
      await savePreferences();
      console.log("Generating exercise plan with preferences:", data);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 120000);

      const response = await fetch("/api/exercise-planner/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: data,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API response error:", response.status, errorText);
        let errorMessage = "Failed to generate exercise plan";
        if (response.status === 500) {
          errorMessage =
            "Server error occurred while generating your plan. This might be due to high demand or complex requirements.";
        } else if (response.status === 401) {
          errorMessage = "Authentication required. Please log in again.";
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage =
            "Invalid request. Please check your inputs and try again.";
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Exercise plan generated:", result);

      let planData = null;
      if (result.plan?.weekly_plan?.parsed_plan) {
        planData = result.plan.weekly_plan.parsed_plan;
      } else if (result.parsed_plan) {
        planData = result.parsed_plan;
      } else if (result.generated_content) {
        try {
          planData = JSON.parse(result.generated_content);
        } catch (e) {
          console.error("Failed to parse generated content:", e);
          planData = { error: "Failed to parse generated plan" };
        }
      }

      if (planData) {
        setGeneratedPlan(planData);
        localStorage.setItem("generatedExercisePlan", JSON.stringify(planData));
        if (planData.weeklyPlan && typeof planData.weeklyPlan === 'object') {
          const allDays = Object.keys(planData.weeklyPlan);
          const expandedDaysObject = allDays.reduce(
            (acc, day) => {
              acc[day] = true;
              return acc;
            },
            {} as { [key: string]: boolean },
          );
          setExpandedDays(expandedDaysObject);
        }
        alert("Exercise plan generated successfully!");
      } else {
        throw new Error("No valid plan data received from server");
      }
    } catch (error: any) {
      console.error("Error generating exercise plan:", error);
      if (error.name === "AbortError") {
        alert(
          "Request timed out after 2 minutes. Please try again. If the problem persists, try reducing the number of exercise days.",
        );
      } else if (error.message?.includes("Failed to fetch")) {
        alert(
          "Network error occurred. Please check your connection and try again.",
        );
      } else {
        const errorMessage = error?.message || "Unknown error occurred";
        alert(
          `Error generating exercise plan: ${errorMessage}. Please try again.`,
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-green-800">
              AI Exercise Planner
            </h1>
            <p className="text-green-600">Loading your saved preferences...</p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-green-800">
            AI Exercise Planner
          </h1>
          <p className="text-green-600">
            Create personalized exercise plans powered by AI
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion
              type="multiple"
              defaultValue={["basic"]}
              className="space-y-4"
            >
              <AccordionItem value="basic">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    Basic Fitness Information
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fitness_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fitness Level *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select fitness level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Beginner">
                                    Beginner
                                  </SelectItem>
                                  <SelectItem value="Intermediate">
                                    Intermediate
                                  </SelectItem>
                                  <SelectItem value="Advanced">
                                    Advanced
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="exercise_experience"
                        render={() => (
                          <FormItem>
                            <FormLabel>
                              Exercise Experience (Select all that apply)
                            </FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {exerciseExperiences.map((experience) => (
                                <FormField
                                  key={experience}
                                  control={form.control}
                                  name="exercise_experience"
                                  render={({ field }) => (
                                    <FormItem
                                      key={experience}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            experience,
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...(field.value || []),
                                                  experience,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== experience,
                                                  ),
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {experience}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {selectedExerciseExperience.includes("Other") && (
                        <FormField
                          control={form.control}
                          name="exercise_experience_other"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Exercise Experience</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Please specify your other exercise experience..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="health">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Health & Medical Information
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="existing_medical_conditions"
                        render={() => (
                          <FormItem>
                            <FormLabel>Existing Medical Conditions</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {medicalConditions.map((condition) => (
                                <FormField
                                  key={condition}
                                  control={form.control}
                                  name="existing_medical_conditions"
                                  render={({ field }) => (
                                    <FormItem
                                      key={condition}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            condition,
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...(field.value || []),
                                                  condition,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== condition,
                                                  ),
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {condition}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {selectedMedicalConditions.includes("Other") && (
                        <FormField
                          control={form.control}
                          name="existing_medical_conditions_other"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Medical Conditions</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Please specify your other medical conditions..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="injuries_or_limitations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Injuries or Physical Limitations
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe any injuries, limitations, or areas to avoid during exercise..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="current_medications"
                        render={() => (
                          <FormItem>
                            <FormLabel>
                              Current Medications (Optional)
                            </FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {commonMedications.map((medication) => (
                                <FormField
                                  key={medication}
                                  control={form.control}
                                  name="current_medications"
                                  render={({ field }) => (
                                    <FormItem
                                      key={medication}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            medication,
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...(field.value || []),
                                                  medication,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== medication,
                                                  ),
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {medication}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {selectedMedications.includes("Other") && (
                        <FormField
                          control={form.control}
                          name="current_medications_other"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Current Medications</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Please specify your other medications..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="doctor_clearance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I have medical clearance to exercise *
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="goals">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Fitness Goals
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="primary_goal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Goal *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select primary goal" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Lose fat">
                                    Lose Fat
                                  </SelectItem>
                                  <SelectItem value="Build muscle">
                                    Build Muscle
                                  </SelectItem>
                                  <SelectItem value="Increase endurance">
                                    Increase Endurance
                                  </SelectItem>
                                  <SelectItem value="Flexibility">
                                    Improve Flexibility
                                  </SelectItem>
                                  <SelectItem value="General fitness">
                                    General Fitness
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="secondary_goal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Secondary Goal (Optional)</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select secondary goal" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Lose fat">
                                    Lose Fat
                                  </SelectItem>
                                  <SelectItem value="Build muscle">
                                    Build Muscle
                                  </SelectItem>
                                  <SelectItem value="Increase endurance">
                                    Increase Endurance
                                  </SelectItem>
                                  <SelectItem value="Flexibility">
                                    Improve Flexibility
                                  </SelectItem>
                                  <SelectItem value="General fitness">
                                    General Fitness
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="goal_timeline_weeks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Goal Timeline (weeks) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g., 12"
                                  value={field.value ?? ""}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="target_weight_kg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Target Weight (kg) - Optional
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="Enter target weight"
                                  value={field.value ?? ""}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="muscle_groups_focus"
                        render={() => (
                          <FormItem>
                            <FormLabel>Muscle Groups to Focus On</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {muscleGroups.map((group) => (
                                <FormField
                                  key={group}
                                  control={form.control}
                                  name="muscle_groups_focus"
                                  render={({ field }) => (
                                    <FormItem
                                      key={group}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(group)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...(field.value || []),
                                                  group,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== group,
                                                  ),
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {group}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="lifestyle">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Lifestyle & Schedule
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="exercise_days_per_week"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exercise Days per Week *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="7"
                                  placeholder="e.g., 3"
                                  value={field.value ?? ""}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="available_time_per_session"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Time per Session (minutes) *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g., 60"
                                  value={field.value ?? ""}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="preferred_time_of_day"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Time of Day *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select preferred time" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Morning">
                                    Morning
                                  </SelectItem>
                                  <SelectItem value="Afternoon">
                                    Afternoon
                                  </SelectItem>
                                  <SelectItem value="Evening">
                                    Evening
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="exercise_location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exercise Location *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select exercise location" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Home">Home</SelectItem>
                                  <SelectItem value="Gym">Gym</SelectItem>
                                  <SelectItem value="Outdoor">
                                    Outdoor
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="daily_step_count_avg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Daily Step Count (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="e.g., 8000"
                                  value={field.value ?? ""}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="job_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Type *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select job type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem
                                    value="Desk job"
                                    title="Office work, computer work, administrative roles"
                                  >
                                    Desk Job
                                  </SelectItem>
                                  <SelectItem
                                    value="Active job"
                                    title="Teaching, nursing, retail, walking/moving throughout the day"
                                  >
                                    Active Job
                                  </SelectItem>
                                  <SelectItem
                                    value="Standing job"
                                    title="Cashier, security guard, factory work, standing most of the day"
                                  >
                                    Standing Job
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="equipment">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    Equipment & Space
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="available_equipment"
                        render={() => (
                          <FormItem>
                            <FormLabel>Available Equipment</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {equipmentOptions.map((equipment) => (
                                <FormField
                                  key={equipment}
                                  control={form.control}
                                  name="available_equipment"
                                  render={({ field }) => (
                                    <FormItem
                                      key={equipment}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            equipment,
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...(field.value || []),
                                                  equipment,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== equipment,
                                                  ),
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {equipment}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {selectedEquipment.includes("Other") && (
                        <FormField
                          control={form.control}
                          name="available_equipment_other"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Available Equipment</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Please specify your other available equipment..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="machines_access"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  I have access to gym machines
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="space_availability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Space Availability *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select space type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Small room">
                                    Small Room
                                  </SelectItem>
                                  <SelectItem value="Open area">
                                    Open Area
                                  </SelectItem>
                                  <SelectItem value="Gym space">
                                    Gym Space
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="preferences">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Preferences & Tracking
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="preferred_difficulty_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Preferred Difficulty Level *
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sleep_quality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sleep Quality *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select sleep quality" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Poor">Poor</SelectItem>
                                  <SelectItem value="Average">
                                    Average
                                  </SelectItem>
                                  <SelectItem value="Good">Good</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="want_to_track_progress"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  I want to track my progress
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="weekly_checkins_enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Enable weekly check-ins</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="accountability_support"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  I want accountability support and reminders
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                type="button"
                onClick={savePreferences}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-blue-400"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Save Preferences
                  </div>
                )}
              </Button>
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-12 py-3 text-lg rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-green-400"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating Exercise Plan...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Generate AI Exercise Plan
                  </div>
                )}
              </Button>
              {generatedPlan && (
                <Button
                  type="button"
                  onClick={() => {
                    setGeneratedPlan(null);
                    localStorage.removeItem("generatedExercisePlan");
                    alert("Exercise plan cleared successfully!");
                  }}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Clear Plan
                  </div>
                </Button>
              )}
            </div>
          </form>
        </Form>

        {generatedPlan && (
          <div className="mt-12 space-y-8">
            <div className="text-center space-y-4 bg-gradient-to-r from-green-600 to-blue-600 text-white py-12 px-8 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold">
                  Your Personalized Exercise Plan
                </h2>
              </div>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                AI-generated workout plan based on your preferences and goals -
                designed specifically for your fitness journey
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 px-4 py-2 text-base"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Full Week Plan
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 px-4 py-2 text-base"
                >
                  <User className="w-4 h-4 mr-2" />
                  Personalized
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 px-4 py-2 text-base"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Progress Tracking
                </Badge>
              </div>
            </div>

            {generatedPlan.error ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-8 text-center">
                  <div className="text-red-600 text-lg font-semibold">
                    {generatedPlan.error}
                  </div>
                </CardContent>
              </Card>
            ) : generatedPlan.weeklyPlan ? (
              <div className="space-y-8">
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-2xl text-blue-800 flex items-center gap-2">
                      <Calendar className="w-6 h-6" />
                      Weekly Schedule Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center space-y-2">
                        <div className="text-3xl font-bold text-blue-600">
                          {generatedPlan.weeklyPlan ? Object.keys(generatedPlan.weeklyPlan).length : 0}
                        </div>
                        <p className="text-blue-700 font-medium">
                          Workout Days
                        </p>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-3xl font-bold text-green-600">
                          {generatedPlan.weeklyPlan ? Object.values(generatedPlan.weeklyPlan).reduce(
                            (total: number, day: any) =>
                              total + (day.duration || 0),
                            0,
                          ) : 0}
                        </div>
                        <p className="text-green-700 font-medium">
                          Total Minutes
                        </p>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-3xl font-bold text-purple-600">
                          {generatedPlan.weeklyPlan && Object.keys(generatedPlan.weeklyPlan).length > 0 ? Math.round(
                            Object.values(generatedPlan.weeklyPlan).reduce(
                              (total: number, day: any) =>
                                total + (day.duration || 0),
                              0,
                            ) / Object.keys(generatedPlan.weeklyPlan).length,
                          ) : 0}
                        </div>
                        <p className="text-purple-700 font-medium">
                          Avg Session
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {generatedPlan.weeklyPlan && Object.entries(generatedPlan.weeklyPlan).map(
                    ([dayKey, dayPlan]: [string, any], dayIndex) => (
                      <Card
                        key={dayKey}
                        className="border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                      >
                        <CardHeader
                          className="bg-gradient-to-r from-green-500 to-blue-500 text-white cursor-pointer"
                          onClick={() => toggleDayExpansion(dayKey)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                                <Dumbbell className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-2xl font-bold text-white">
                                  {dayPlan.dayName} - {dayPlan.focus}
                                </CardTitle>
                                <div className="flex items-center gap-4 mt-2">
                                  <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/30"
                                  >
                                    <Timer className="w-3 h-3 mr-1" />
                                    {dayPlan.duration} min
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/30"
                                  >
                                    <Target className="w-3 h-3 mr-1" />
                                    {dayPlan.mainWorkout?.length || 0} exercises
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            {expandedDays[dayKey] ? (
                              <ChevronUp className="w-6 h-6 text-white" />
                            ) : (
                              <ChevronDown className="w-6 h-6 text-white" />
                            )}
                          </div>
                        </CardHeader>

                        {expandedDays[dayKey] && (
                          <CardContent className="p-8 space-y-8">
                            {dayPlan.warmup && dayPlan.warmup.exercises && dayPlan.warmup.exercises.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="bg-orange-100 p-2 rounded-full">
                                    <Zap className="w-5 h-5 text-orange-600" />
                                  </div>
                                  <h4 className="text-xl font-bold text-orange-700">
                                    Warm-up
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {dayPlan.warmup.exercises.map(
                                    (exercise: any, idx: number) => (
                                      <Card
                                        key={idx}
                                        className="border-orange-200 bg-orange-50"
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-semibold text-orange-800">
                                              {exercise.name}
                                            </h5>
                                            <Badge
                                              variant="outline"
                                              className="text-orange-600 border-orange-300"
                                            >
                                              {exercise.duration} min
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-orange-700">
                                            {exercise.instructions}
                                          </p>
                                        </CardContent>
                                      </Card>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                            <Separator />

                            {dayPlan.mainWorkout && dayPlan.mainWorkout.length > 0 && (
                              <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-6">
                                  <div className="bg-blue-100 p-2 rounded-full">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <h4 className="text-xl font-bold text-blue-700">
                                    Main Workout
                                  </h4>
                                </div>

                                {dayPlan.mainWorkout.map(
                                  (exercise: any, idx: number) => {
                                    const exerciseKey = `${dayKey}-exercise-${idx}`;
                                    return (
                                      <Card
                                        key={idx}
                                        className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg"
                                      >
                                        <CardContent className="p-6">
                                          <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-3">
                                                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                                                  {idx + 1}
                                                </div>
                                                <h5 className="text-xl font-bold text-blue-800">
                                                  {exercise.exerciseName}
                                                </h5>
                                              </div>
                                              <div className="flex gap-2">
                                                {exercise.youtubeSearchTerm && (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                                    onClick={() =>
                                                      window.open(
                                                        `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.youtubeSearchTerm)}`,
                                                        "_blank",
                                                      )
                                                    }
                                                  >
                                                    <Youtube className="w-4 h-4 mr-1" />
                                                    Watch Tutorial
                                                  </Button>
                                                )}
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                                                <div className="text-lg font-bold text-blue-600">
                                                  {exercise.sets}
                                                </div>
                                                <div className="text-sm text-blue-700">
                                                  Sets
                                                </div>
                                              </div>
                                              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                                                <div className="text-lg font-bold text-green-600">
                                                  {exercise.reps}
                                                </div>
                                                <div className="text-sm text-green-700">
                                                  Reps
                                                </div>
                                              </div>
                                              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                                                <div className="text-lg font-bold text-purple-600">
                                                  {exercise.restSeconds}s
                                                </div>
                                                <div className="text-sm text-purple-700">
                                                  Rest
                                                </div>
                                              </div>
                                              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                                                <div className="text-lg font-bold text-orange-600">
                                                  {exercise.targetMuscles
                                                    ?.length || 0}
                                                </div>
                                                <div className="text-sm text-orange-700">
                                                  Muscles
                                                </div>
                                              </div>
                                            </div>

                                            {exercise.targetMuscles &&
                                              exercise.targetMuscles.length >
                                                0 && (
                                                <div className="space-y-2">
                                                  <p className="font-medium text-blue-700">
                                                    Target Muscles:
                                                  </p>
                                                  <div className="flex flex-wrap gap-2">
                                                    {exercise.targetMuscles.map(
                                                      (
                                                        muscle: string,
                                                        muscleIdx: number,
                                                      ) => (
                                                        <Badge
                                                          key={muscleIdx}
                                                          variant="secondary"
                                                          className="bg-blue-100 text-blue-700"
                                                        >
                                                          {muscle}
                                                        </Badge>
                                                      ),
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4">
                                              <p className="text-gray-700 leading-relaxed">
                                                {exercise.instructions}
                                              </p>
                                            </div>

                                            {exercise.alternatives &&
                                              exercise.alternatives.length >
                                                0 && (
                                                <div className="space-y-3">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      toggleExerciseExpansion(
                                                        exerciseKey,
                                                      )
                                                    }
                                                    className="w-full border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                                                  >
                                                    <Repeat className="w-4 h-4 mr-2" />
                                                    {expandedExercises[
                                                      exerciseKey
                                                    ]
                                                      ? "Hide"
                                                      : "Show"}{" "}
                                                    Alternative Exercises (
                                                    {
                                                      exercise.alternatives
                                                        .length
                                                    }
                                                    )
                                                    {expandedExercises[
                                                      exerciseKey
                                                    ] ? (
                                                      <ChevronUp className="w-4 h-4 ml-2" />
                                                    ) : (
                                                      <ChevronDown className="w-4 h-4 ml-2" />
                                                    )}
                                                  </Button>

                                                  {expandedExercises[
                                                    exerciseKey
                                                  ] && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                      {exercise.alternatives.map(
                                                        (
                                                          alt: any,
                                                          altIdx: number,
                                                        ) => (
                                                          <Card
                                                            key={altIdx}
                                                            className="border-indigo-200 bg-indigo-50"
                                                          >
                                                            <CardContent className="p-4">
                                                              <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                  <h6 className="font-semibold text-indigo-800">
                                                                    {alt.name}
                                                                  </h6>
                                                                  {alt.youtubeSearchTerm && (
                                                                    <Button
                                                                      variant="ghost"
                                                                      size="sm"
                                                                      className="text-red-600 hover:bg-red-50 p-1"
                                                                      onClick={() =>
                                                                        window.open(
                                                                          `https://www.youtube.com/results?search_query=${encodeURIComponent(alt.youtubeSearchTerm)}`,
                                                                          "_blank",
                                                                        )
                                                                      }
                                                                    >
                                                                      <Youtube className="w-4 h-4" />
                                                                    </Button>
                                                                  )}
                                                                </div>
                                                                <p className="text-sm text-indigo-700">
                                                                  {
                                                                    alt.instructions
                                                                  }
                                                                </p>
                                                              </div>
                                                            </CardContent>
                                                          </Card>
                                                        ),
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  },
                                )}
                              </div>
                            )}

                            <Separator />

                            {dayPlan.cooldown && dayPlan.cooldown.exercises && dayPlan.cooldown.exercises.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="bg-green-100 p-2 rounded-full">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  </div>
                                  <h4 className="text-xl font-bold text-green-700">
                                    Cool-down
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {dayPlan.cooldown.exercises.map(
                                    (exercise: any, idx: number) => (
                                      <Card
                                        key={idx}
                                        className="border-green-200 bg-green-50"
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-semibold text-green-800">
                                              {exercise.name}
                                            </h5>
                                            <Badge
                                              variant="outline"
                                              className="text-green-600 border-green-300"
                                            >
                                              {exercise.duration} min
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-green-700">
                                            {exercise.instructions}
                                          </p>
                                        </CardContent>
                                      </Card>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ),
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-6 mt-12">
                  {generatedPlan.progressionTips && (
                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardHeader>
                        <CardTitle className="text-blue-800 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Progression Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {generatedPlan.progressionTips.map(
                            (tip: string, idx: number) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-blue-700"
                              >
                                <ArrowRight className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                                {tip}
                              </li>
                            ),
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {generatedPlan.safetyNotes && (
                    <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                      <CardHeader>
                        <CardTitle className="text-red-800 flex items-center gap-2">
                          <Heart className="w-5 h-5" />
                          Safety Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {generatedPlan.safetyNotes.map(
                            (note: string, idx: number) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-red-700"
                              >
                                <ArrowRight className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0" />
                                {note}
                              </li>
                            ),
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {generatedPlan.nutritionTips && (
                    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                      <CardHeader>
                        <CardTitle className="text-green-800 flex items-center gap-2">
                          <Utensils className="w-5 h-5" />
                          Nutrition Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {generatedPlan.nutritionTips.map(
                            (tip: string, idx: number) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-green-700"
                              >
                                <ArrowRight className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                                {tip}
                              </li>
                            ),
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
