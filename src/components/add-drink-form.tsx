
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, MapPin, Sparkles, Star, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { getCurrentLocation, type Coordinates } from '@/services/geolocation';
import { scoreDrinkDetails, ScoreDrinkDetailsInput, ScoreDrinkDetailsOutput } from '@/ai/flows/score-drink-details';
import RadarChartComponent from './radar-chart';
import { useToast } from "@/hooks/use-toast"


const drinkSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brewery: z.string().min(1, 'Brewery/Distillery is required'),
  type: z.enum(['sake', 'whiskey', 'beer', 'wine']),
  rating: z.number().min(1).max(5),
  comments: z.string().optional(),
  photo: z.any().optional(), // Use any for File/Blob
  isPublic: z.boolean().default(true),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

type DrinkFormData = z.infer<typeof drinkSchema>;

interface AddDrinkFormProps {
  onClose: () => void;
}

export default function AddDrinkForm({ onClose }: AddDrinkFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<DrinkFormData>({
    resolver: zodResolver(drinkSchema),
    defaultValues: {
      rating: 3,
      isPublic: true,
    },
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [aiScore, setAiScore] = useState<ScoreDrinkDetailsOutput | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const watchedPhoto = watch('photo');
  const watchedRating = watch('rating');
  const watchedType = watch('type');
  const watchedName = watch('name');
  const watchedBrewery = watch('brewery');
  const watchedComments = watch('comments');


  useEffect(() => {
    if (watchedPhoto && watchedPhoto instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(watchedPhoto);
    } else {
      setPhotoPreview(null);
    }
  }, [watchedPhoto]);

  const handlePhotoUploadClick = () => {
    photoInputRef.current?.click();
  };

  const handleFetchLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
      setValue('location', coords);
      toast({ title: "Location fetched successfully" });
    } catch (error) {
      console.error('Error fetching location:', error);
       toast({ title: "Error fetching location", description: "Could not get current location.", variant: "destructive" });
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleAiScore = async () => {
    if (!photoPreview || !watchedType || !watchedName || !watchedBrewery) {
       toast({ title: "Missing Information", description:"Please provide drink name, brewery/distillery, type, and a photo before scoring.", variant: "destructive" });
      return;
    }
    setIsScoring(true);
    setScoreError(null);
    try {
       const input: ScoreDrinkDetailsInput = {
        photoDataUri: photoPreview,
        description: `Name: ${watchedName}\nBrewery/Distillery: ${watchedBrewery}\nType: ${watchedType}\nComments: ${watchedComments || 'N/A'}`,
        drinkType: watchedType,
      };
      const result = await scoreDrinkDetails(input);
      setAiScore(result);
       toast({ title: "AI Scoring Successful", description: "Drink details scored by AI."});
    } catch (error) {
      console.error('Error scoring drink:', error);
      setScoreError('Failed to score drink details. Please try again.');
       toast({ title: "AI Scoring Failed", description:"An error occurred during AI scoring. Please try again.", variant: "destructive" });
    } finally {
      setIsScoring(false);
    }
  };

   const removePhoto = () => {
    setValue('photo', null);
    setPhotoPreview(null);
    setAiScore(null); // Clear AI score if photo is removed
    if (photoInputRef.current) {
      photoInputRef.current.value = ''; // Reset file input
    }
     toast({ title: "Photo Removed" });
  };

  const onSubmit = (data: DrinkFormData) => {
    console.log('Form submitted:', data);
    // Here you would typically send the data to your backend API
    // For now, just log it and close the form
    toast({ title: "Drink Added!", description: `${data.name} has been added to your list.` });
    onClose(); // Close the form/modal after submission
  };


  return (
    <Card className="w-full max-w-2xl mx-auto my-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-primary-foreground">Log a New Drink</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Drink Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g., Dassai 23" />
              {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="brewery">Brewery / Distillery</Label>
              <Input id="brewery" {...register('brewery')} placeholder="e.g., Asahi Shuzo" />
              {errors.brewery && <p className="text-destructive text-sm mt-1">{errors.brewery.message}</p>}
            </div>
          </div>

          {/* Type and Rating */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <Label htmlFor="type">Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select drink type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sake">Sake</SelectItem>
                      <SelectItem value="whiskey">Whiskey</SelectItem>
                      <SelectItem value="beer">Beer</SelectItem>
                      <SelectItem value="wine">Wine</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-destructive text-sm mt-1">{errors.type.message}</p>}
            </div>
             <div>
                <Label htmlFor="rating">Rating (1-5 Stars)</Label>
                 <Controller
                    name="rating"
                    control={control}
                    render={({ field }) => (
                         <div className="flex space-x-1 items-center">
                         {[1, 2, 3, 4, 5].map((star) => (
                             <Star
                             key={star}
                             className={`cursor-pointer h-6 w-6 ${
                                 star <= watchedRating ? 'fill-accent text-accent' : 'text-muted-foreground'
                             }`}
                             onClick={() => field.onChange(star)}
                             />
                         ))}
                         <span className="ml-2 text-sm text-muted-foreground">({watchedRating}/5)</span>
                         </div>
                    )}
                 />
            </div>
          </div>


          {/* Comments */}
          <div>
            <Label htmlFor="comments">Comments</Label>
            <Textarea id="comments" {...register('comments')} placeholder="Tasting notes, occasion, etc." />
          </div>

          {/* Photo Upload */}
          <div>
            <Label>Photo</Label>
            <div className="flex items-center gap-4 mt-2">
              <Button type="button" variant="outline" onClick={handlePhotoUploadClick}>
                <Upload className="mr-2 h-4 w-4" /> Upload Photo
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={photoInputRef}
                onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (file) {
                       setValue('photo', file);
                   }
                }}
              />
                {photoPreview && (
                    <div className="relative">
                    <Image src={photoPreview} alt="Drink preview" width={80} height={80} className="rounded-md object-cover" />
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={removePhoto}
                        aria-label="Remove photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                )}
            </div>
          </div>

          {/* Location */}
           <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <Label>Location</Label>
                    {location && (
                    <span className="text-sm text-muted-foreground ml-2">
                        Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
                    </span>
                    )}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFetchLocation}
                    disabled={isFetchingLocation}
                >
                    {isFetchingLocation ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <MapPin className="mr-2 h-4 w-4" />
                    )}
                    {location ? 'Update Location' : 'Get Current Location'}
                </Button>
           </div>

           {/* AI Scoring */}
           <div className="space-y-4 border-t pt-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <Label>AI Scoring</Label>
                </div>
               <Button
                 type="button"
                 variant="outline"
                 onClick={handleAiScore}
                 disabled={isScoring || !photoPreview || !watchedType || !watchedName || !watchedBrewery}
                 size="sm"
               >
                 {isScoring ? (
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                   <Sparkles className="mr-2 h-4 w-4" />
                 )}
                 {aiScore ? 'Rescore with AI' : 'Score with AI'}
               </Button>
             </div>
              {scoreError && (
                <Alert variant="destructive">
                    <AlertTitle>Scoring Error</AlertTitle>
                    <AlertDescription>{scoreError}</AlertDescription>
                </Alert>
                )}
             {aiScore && <RadarChartComponent scoreData={aiScore} />}
           </div>


          {/* Visibility */}
          <div className="flex items-center space-x-2">
            <Controller
              name="isPublic"
              control={control}
              render={({ field }) => (
                 <Checkbox
                    id="isPublic"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                 />
              )}
            />
            <Label htmlFor="isPublic" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Make this log public
            </Label>
          </div>
           <CardFooter className="flex justify-end gap-2 pt-6">
             <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
             <Button type="submit" disabled={isSubmitting || isScoring}>
               {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
               Add Drink
             </Button>
           </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
