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
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from '@/services/storage'; // Import storage service
import { addDrink } from '@/services/drinks'; // Import drinks service
import { getAuth, type User } from 'firebase/auth';
import type { NewDrinkLogData } from '@/types/drink'; // Import drink type

const drinkSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brewery: z.string().min(1, 'Brewery/Distillery is required'),
  type: z.enum(['sake', 'whiskey', 'beer', 'wine'], { required_error: "Drink type is required" }),
  rating: z.number().min(1).max(5),
  comments: z.string().optional(),
  photoFile: z.instanceof(File).optional().nullable(), // Represents the file to be uploaded
  isPublic: z.boolean().default(true),
  // Location is handled separately by state, not directly in form data schema for submission
  // location: z.object({
  //   latitude: z.number(),
  //   longitude: z.number(),
  // }).optional().nullable(),
});

type DrinkFormData = z.infer<typeof drinkSchema>;

interface AddDrinkFormProps {
  onClose: () => void;
  onDrinkAdded: () => void; // Callback to refresh list
}

export default function AddDrinkForm({ onClose, onDrinkAdded }: AddDrinkFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting: isFormSubmitting }, reset } = useForm<DrinkFormData>({
    resolver: zodResolver(drinkSchema),
    defaultValues: {
      rating: 3,
      isPublic: true,
      photoFile: null,
      // location: null, // Removed from default form values
      comments: '',
    },
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null); // Use state for location display
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [aiScore, setAiScore] = useState<ScoreDrinkDetailsOutput | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false); // Track upload/save state

  const photoInputRef = useRef<HTMLInputElement>(null);
  const watchedPhotoFile = watch('photoFile');
  const watchedRating = watch('rating');
  const watchedType = watch('type');
  const watchedName = watch('name');
  const watchedBrewery = watch('brewery');
  const watchedComments = watch('comments');

  useEffect(() => {
    if (watchedPhotoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(watchedPhotoFile);
    } else {
      setPhotoPreview(null);
    }
  }, [watchedPhotoFile]);

  const handlePhotoUploadClick = () => {
    photoInputRef.current?.click();
  };

  const handleFetchLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const coords = await getCurrentLocation();
      // setValue('location', coords, { shouldValidate: true }); // No longer setting location in form data
      setLocation(coords); // Update local state for display and submission
      toast({ title: "Location fetched successfully" });
    } catch (error) {
      console.error('Error fetching location:', error);
      const errorMessage = error instanceof Error ? error.message : "Could not get current location.";
      toast({ title: "Error fetching location", description: errorMessage, variant: "destructive" });
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleAiScore = async () => {
    if (!photoPreview || !watchedType || !watchedName || !watchedBrewery) {
      toast({ title: "Missing Information", description: "Please provide drink name, brewery/distillery, type, and a photo before scoring.", variant: "destructive" });
      return;
    }
    setIsScoring(true);
    setScoreError(null);
    try {
      const input: ScoreDrinkDetailsInput = {
        photoDataUri: photoPreview,
        description: `Name: ${watchedName}
Brewery/Distillery: ${watchedBrewery}
Type: ${watchedType}
Comments: ${watchedComments || 'N/A'}`,
        drinkType: watchedType,
      };
      const result = await scoreDrinkDetails(input);
      setAiScore(result);
      toast({ title: "AI Scoring Successful", description: "Drink details scored by AI." });
    } catch (error) {
      console.error('Error scoring drink:', error);
      setScoreError('Failed to score drink details. Please try again.');
      toast({ title: "AI Scoring Failed", description: "An error occurred during AI scoring. Please try again.", variant: "destructive" });
    } finally {
      setIsScoring(false);
    }
  };

  const removePhoto = () => {
    setValue('photoFile', null);
    setPhotoPreview(null);
    setAiScore(null); // Clear AI score if photo is removed
    if (photoInputRef.current) {
      photoInputRef.current.value = ''; // Reset file input
    }
    toast({ title: "Photo Removed" });
  };

 const onSubmit = async (data: DrinkFormData) => {
    setIsUploading(true); // Start loading state for submission process
    let photoUrl: string | null = null;

    try {
      // --- Authentication check ---
      const auth = getAuth();
      const user: User | null = auth.currentUser;
      // console.log('auth.currentUser in onSubmit:', auth.currentUser); // Keep for debugging if needed

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add a drink.",
          variant: "destructive",
        });
        // No need to set isUploading false here, finally block handles it.
        return; // Stop the function here
      }
      // --- End of authentication check ---

      // 1. Upload photo if present
      if (data.photoFile) {
        toast({ title: "Uploading photo..." });
        // Provide a more specific path including user ID and timestamp for uniqueness
        photoUrl = await uploadFile(data.photoFile, `drink_photos/${user.uid}/${Date.now()}_${data.photoFile.name}`);
        toast({ title: "Photo uploaded successfully!" });
      }

      // 2. Prepare drink data (using location from state)
      const newDrinkData: NewDrinkLogData = {
        userId: user.uid,
        name: data.name,
        brewery: data.brewery,
        type: data.type,
        rating: data.rating,
        comments: data.comments || '',
        photoUrl: photoUrl,
        isPublic: data.isPublic,
        location: location, // Use the location state updated by handleFetchLocation
        aiScore: aiScore, // Use AI score from state
        timestamp: new Date(), // Correct field name as per NewDrinkLogData type
      };
       // console.log('New drink data before addDrink:', newDrinkData); // Keep for debugging if needed

      // 3. Add drink log to the database
      await addDrink(newDrinkData);

      // 4. Success handling
      toast({ title: "Drink Log Added!", description: `${data.name} has been successfully logged.` });
      onDrinkAdded(); // Trigger callback to refresh the list
      reset(); // Reset the form fields
      setPhotoPreview(null); // Clear photo preview
      setAiScore(null); // Clear AI score display
      setLocation(null); // Clear location display
      onClose(); // Close the form/dialog

    } catch (error) {
      console.error('Error submitting drink log:', error);
      const errorMessage = error instanceof Error ? error.message : "Could not save the drink log. Please try again.";
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
      // Corrected: Removed nested catch and extra semicolon here
    } finally {
      setIsUploading(false); // End loading state regardless of success or failure
    }
  }; // Correct closing brace for the function


  const isSubmitting = isFormSubmitting || isUploading || isScoring || isFetchingLocation; // Combined loading state

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
              <Input id="name" {...register('name')} placeholder="e.g., Dassai 23" disabled={isSubmitting} />
              {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="brewery">Brewery / Distillery</Label>
              <Input id="brewery" {...register('brewery')} placeholder="e.g., Asahi Shuzo" disabled={isSubmitting} />
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
                rules={{ required: 'Drink type is required' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
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
                  <div className="flex space-x-1 items-center pt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`cursor-pointer h-6 w-6 ${star <= watchedRating ? 'fill-accent text-accent' : 'text-muted-foreground'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !isSubmitting && field.onChange(star)}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        aria-disabled={isSubmitting}
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
            <Textarea id="comments" {...register('comments')} placeholder="Tasting notes, occasion, etc." disabled={isSubmitting}/>
          </div>

          {/* Photo Upload */}
          <div>
            <Label>Photo</Label>
            <div className="flex items-center gap-4 mt-2">
              <Button type="button" variant="outline" onClick={handlePhotoUploadClick} disabled={isSubmitting}>
                <Upload className="mr-2 h-4 w-4" /> Upload Photo
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                {...register('photoFile')} // Keep registration
                ref={photoInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setValue('photoFile', file || null, { shouldValidate: true });
                }}
                disabled={isSubmitting}
              />
              {photoPreview && (
                <div className="relative">
                  <Image src={photoPreview} alt="Drink preview" width={80} height={80} className="rounded-md object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10"
                    onClick={removePhoto}
                    aria-label="Remove photo"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
             {errors.photoFile && <p className="text-destructive text-sm mt-1">{errors.photoFile.message?.toString()}</p>}
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
               {!location && !isFetchingLocation && <span className="text-sm text-muted-foreground ml-2 italic">No location set</span>}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFetchLocation}
              disabled={isSubmitting} // Disable if any process is running
            >
              {isFetchingLocation ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              {location ? 'Update Location' : 'Get Current Location'}
            </Button>
          </div>
           {/* Removed error display for location as it's not in the schema */} 


          {/* AI Scoring */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <Label>AI Scoring (Optional)</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAiScore}
                disabled={isSubmitting || !photoPreview || !watchedType || !watchedName || !watchedBrewery}
                size="sm"
                aria-label={aiScore ? 'Rescore drink with AI' : 'Score drink with AI'}
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
            {aiScore && !scoreError && <RadarChartComponent scoreData={aiScore} />}
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
                  aria-labelledby="isPublicLabel"
                  disabled={isSubmitting}
                />
              )}
            />
            <Label htmlFor="isPublic" id="isPublicLabel" className={`text-sm font-medium leading-none ${isSubmitting ? 'cursor-not-allowed opacity-70' : ''}`}>
              Make this log public
            </Label>
          </div>

          <CardFooter className="flex justify-end gap-2 pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {/* Simplified loading indicator */} 
              {isUploading ? 'Saving...' : 'Add Drink'}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
