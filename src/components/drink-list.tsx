
'use client';

import React, { useState, useEffect, useCallback, } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Star, MapPin, Clock, Trash2, Edit, Eye, EyeOff, Loader2, AlertTriangle, Plus } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import RadarChartComponent from './radar-chart';
import { getDrinks, deleteDrink, updateDrink } from '@/services/drinks'; // Import Firestore services
import type { DrinkLog } from '@/types/drink'; // Import shared types
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns'; // For relative time
import type { QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'; // Correct import for pagination
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import AddDrinkForm from './add-drink-form'; // Import AddDrinkForm for the modal content

// Function to safely convert Firestore Timestamp to Date for display
const timestampToDate = (timestamp: Timestamp | Date): Date => {
  if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }
  // Fallback for potential data inconsistencies or if timestamp is already a Date (unlikely from Firestore)
  if (timestamp instanceof Date) {
      return timestamp;
  }
  console.warn("Encountered non-Timestamp value where Timestamp was expected:", timestamp);
  return new Date(); // Return current date as a fallback
};

// Define Zod schema for the Edit form (can be similar or different from Add form)
const EditDrinkSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brewery: z.string().min(1, 'Brewery/Distillery is required'),
  type: z.enum(['sake', 'whiskey', 'beer', 'wine'], { required_error: "Drink type is required" }),
  rating: z.number().min(1).max(5),
  comments: z.string().optional(),
  isPublic: z.boolean().default(true),
  // Location and photo editing might be handled differently or omitted
});
type EditDrinkFormData = z.infer<typeof EditDrinkSchema>;


export default function DrinkList() {
  const { toast } = useToast();
  const [drinks, setDrinks] = useState<DrinkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'timestamp' | 'rating'>('timestamp');
  const [filterType, setFilterType] = useState<'all' | 'sake' | 'whiskey' | 'beer' | 'wine'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track deleting state by ID
  const [isToggling, setIsToggling] = useState<string | null>(null); // Track toggling state by ID
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null); // Use QueryDocumentSnapshot
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAddDrinkDialogOpen, setIsAddDrinkDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDrink, setEditingDrink] = useState<DrinkLog | null>(null);

  // Form for editing drinks
  const editForm = useForm<EditDrinkFormData>({
    resolver: zodResolver(EditDrinkSchema),
    defaultValues: {
        name: "",
        brewery: "",
        type: "sake",
        rating: 3,
        comments: "",
        isPublic: true,
    },
  });

  const fetchDrinksData = useCallback(async (loadMore = false) => {
    if (!loadMore) {
        setIsLoading(true);
        setError(null); // Reset error on new fetch/filter
        // Reset state only if not loading more
        setDrinks([]);
        setLastVisible(null);
        setHasMore(true);
    } else if (!hasMore) {
        // Don't fetch more if we know there are no more drinks
        return;
    } else {
         setIsLoadingMore(true);
         setError(null);
    }

    try {
      const { drinks: fetchedDrinks, lastVisibleDoc } = await getDrinks({
        sortBy,
        filterType,
        // userId: 'some_user_id', // Pass user ID if needed
        lastVisibleDoc: loadMore ? lastVisible : null,
        resultsPerPage: 9,
      });

      setDrinks(prevDrinks => loadMore ? [...prevDrinks, ...fetchedDrinks] : fetchedDrinks);
      setLastVisible(lastVisibleDoc);
      setHasMore(fetchedDrinks.length === 9); // Simpler check: if we fetched less than requested, no more pages

    } catch (err) {
      // Log the error in the console.
      console.error("Failed to fetch drinks:", err);
      const errorMessage = err instanceof Error ? err.message : "Could not load drinks. Please try again later.";
      setError(errorMessage);
      toast({
        title: "Error Loading Drinks",
        description: errorMessage,
        variant: "destructive",
      });
       // Stop loading indicators on error
       setIsLoading(false);
       setIsLoadingMore(false);
    } finally {
       // Ensure loading indicators are turned off
       if (!loadMore) setIsLoading(false);
       else setIsLoadingMore(false);
    }
  }, [sortBy, filterType, lastVisible, hasMore, toast]); // Add hasMore to dependencies

  // Initial fetch and refetch on filter/sort change
  useEffect(() => {
      // Reset pagination and fetch data when filters/sort change
      setLastVisible(null);
      setHasMore(true);
      fetchDrinksData(false); // Fetch initial data for the new settings
  }, [sortBy, filterType, fetchDrinksData]); // Include fetchDrinksData in dependencies


  const handleDrinkAdded = () => {
    setIsAddDrinkDialogOpen(false); // Close the dialog
    // Trigger a refetch of the first page to show the new item
    setLastVisible(null);
    setHasMore(true);
    fetchDrinksData(false);
    toast({ title: "Drink added successfully!" });
  };


  const handleSortChange = (value: 'timestamp' | 'rating') => {
    setSortBy(value);
  };

  const handleFilterChange = (value: 'all' | 'sake' | 'whiskey' | 'beer' | 'wine') => {
    setFilterType(value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this drink log?")) {
      setIsDeleting(id);
      try {
        await deleteDrink(id);
        setDrinks(drinks.filter(drink => drink.id !== id));
        toast({ title: "Drink Deleted", description: "The drink log has been removed." });
        // TODO: Optionally delete photo from Storage here if needed
      } catch (error) {
        // Log the error in the console.
        console.error(`Error deleting drink ${id}:`, error);
        toast({ title: "Deletion Failed", description: "Could not delete the drink log.", variant: "destructive" });
      } finally {
        setIsDeleting(null);
      }
    }
  };

   const handleEditClick = (drink: DrinkLog) => {
        setEditingDrink(drink);
        editForm.reset({ // Populate form with existing data
            name: drink.name,
            brewery: drink.brewery,
            type: drink.type,
            rating: drink.rating,
            comments: drink.comments ?? '',
            isPublic: drink.isPublic,
        });
        setIsEditDialogOpen(true);
   };

   const handleEditSubmit = async (data: EditDrinkFormData) => {
        if (!editingDrink) return;

        editForm.formState.isSubmitting = true; // Manual control over submitting state needed
        try {
            await updateDrink(editingDrink.id, {
                name: data.name,
                brewery: data.brewery,
                type: data.type,
                rating: data.rating,
                comments: data.comments,
                isPublic: data.isPublic,
                // Keep existing photoUrl, location, aiScore unless edit form modifies them
            });

            // Update local state optimistically or refetch
             setDrinks(drinks.map(d => d.id === editingDrink.id ? { ...d, ...data } : d));

            toast({ title: "Update Successful", description: "Drink log updated." });
            setIsEditDialogOpen(false);
            setEditingDrink(null);
        } catch (error) {
            // Log the error in the console.
            console.error(`Error updating drink ${editingDrink.id}:`, error);
            toast({ title: "Update Failed", description: "Could not update drink log.", variant: "destructive" });
        } finally {
             editForm.formState.isSubmitting = false;
        }
    };

  const toggleVisibility = async (id: string, currentVisibility: boolean) => {
     setIsToggling(id);
     try {
        const newVisibility = !currentVisibility;
        await updateDrink(id, { isPublic: newVisibility });
        setDrinks(drinks.map(drink =>
            drink.id === id ? { ...drink, isPublic: newVisibility } : drink
        ));
        toast({ title: "Visibility Updated", description: `Drink is now ${newVisibility ? 'public' : 'private'}.` });
     } catch (error) {
         // Log the error in the console.
         console.error(`Error toggling visibility for drink ${id}:`, error);
         toast({ title: "Update Failed", description: "Could not update drink visibility.", variant: "destructive" });
     } finally {
         setIsToggling(null);
     }
  };

  // Apply client-side search AFTER fetching
  const displayedDrinks = drinks.filter(drink =>
    drink.name.toLowerCase().includes(searchTerm) ||
    drink.brewery.toLowerCase().includes(searchTerm) ||
    (drink.comments && drink.comments.toLowerCase().includes(searchTerm))
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-foreground">My Drink Logs</h1>
         {/* Add Drink Dialog Trigger */}
        <Dialog open={isAddDrinkDialogOpen} onOpenChange={setIsAddDrinkDialogOpen}>
            <DialogTrigger asChild>
            <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Drink
            </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
             {/* Render AddDrinkForm inside the Dialog */}
                <AddDrinkForm
                    onClose={() => setIsAddDrinkDialogOpen(false)}
                    onDrinkAdded={handleDrinkAdded}
                />
            </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search loaded drinks..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <Select onValueChange={handleFilterChange} value={filterType}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sake">Sake</SelectItem>
            <SelectItem value="whiskey">Whiskey</SelectItem>
            <SelectItem value="beer">Beer</SelectItem>
            <SelectItem value="wine">Wine</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={handleSortChange} value={sortBy}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timestamp">Sort by Date (Newest)</SelectItem>
            <SelectItem value="rating">Sort by Rating (Highest)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && !isLoadingMore && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="shadow-md animate-pulse">
                    <CardHeader className="p-0">
                        <div className="aspect-video bg-muted rounded-t-lg"></div>
                    </CardHeader>
                     <CardContent className="p-4 space-y-3">
                        <div className="h-6 w-3/4 bg-muted rounded"></div>
                        <div className="h-4 w-1/2 bg-muted rounded"></div>
                        <div className="h-5 w-2/5 bg-muted rounded mt-2"></div>
                        <div className="h-4 w-full bg-muted rounded"></div>
                        <div className="h-4 w-4/5 bg-muted rounded"></div>
                    </CardContent>
                     <CardFooter className="border-t p-3 flex justify-between">
                         <div className="h-4 w-1/3 bg-muted rounded"></div>
                         <div className="flex gap-2">
                            <div className="h-7 w-7 bg-muted rounded-full"></div>
                            <div className="h-7 w-7 bg-muted rounded-full"></div>
                            <div className="h-7 w-7 bg-muted rounded-full"></div>
                         </div>
                     </CardFooter>
                </Card>
            ))}
         </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center text-destructive py-10 flex flex-col items-center gap-2 bg-destructive/10 rounded-lg p-6">
            <AlertTriangle className="h-10 w-10" />
          <p className="font-semibold text-lg">Error Loading Drinks</p>
          <p>{error}</p>
          <Button onClick={() => fetchDrinksData(false)} variant="destructive" size="sm" className="mt-2">Retry</Button>
        </div>
      )}

      {/* Drink List Grid */}
      {!isLoading && !error && displayedDrinks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedDrinks.map((drink) => (
            <Card key={drink.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-200 bg-card text-card-foreground">
              <CardHeader className="p-0"> {/* Remove padding */}
                {drink.photoUrl ? (
                  <div className="relative aspect-video rounded-t-lg overflow-hidden">
                    <Image src={drink.photoUrl} alt={drink.name} layout="fill" objectFit="cover" />
                  </div>
                ) : (
                   <div className="relative aspect-video rounded-t-lg overflow-hidden bg-muted flex items-center justify-center text-muted-foreground">
                        <span>No Image</span>
                   </div>
                )}
              </CardHeader>
               <CardContent className="p-4 flex-grow space-y-3"> {/* Add padding back */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <CardTitle className="text-xl font-semibold mb-1">{drink.name}</CardTitle>
                    <CardDescription>{drink.brewery}</CardDescription>
                  </div>
                  <Badge variant={drink.type === 'sake' ? 'default' : 'secondary'} className="capitalize flex-shrink-0 ml-2">{drink.type}</Badge>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < drink.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">({drink.rating}/5)</span>
                </div>
                {drink.comments && <p className="text-sm text-muted-foreground italic line-clamp-3">&ldquo;{drink.comments}&rdquo;</p>}

                {drink.aiScore && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-2 text-foreground">AI Score Analysis</h4>
                    <RadarChartComponent scoreData={drink.aiScore} size={150} />
                  </div>
                )}

              </CardContent>
              <CardFooter className="flex flex-col items-start text-xs text-muted-foreground border-t border-border p-3 space-y-2"> {/* Adjust padding */}
                <div className="flex justify-between w-full items-center">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(timestampToDate(drink.timestamp), { addSuffix: true })}</span>
                  </div>
                  {drink.location && (
                    <div className="flex items-center gap-1 truncate ml-2" title={`Lat: ${drink.location.latitude}, Lon: ${drink.location.longitude}`}>
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">Lat: {drink.location.latitude.toFixed(2)}, Lon: {drink.location.longitude.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between w-full items-center pt-2">
                  <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-xs" // Make smaller
                      onClick={() => toggleVisibility(drink.id, drink.isPublic)}
                      title={drink.isPublic ? "Make Private" : "Make Public"}
                      disabled={isToggling === drink.id || isDeleting === drink.id}
                    >
                     {isToggling === drink.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (drink.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />) }
                     <span className="ml-1 hidden sm:inline">{drink.isPublic ? 'Public' : 'Private'}</span>
                    </Button>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditClick(drink)} title="Edit" disabled={isDeleting === drink.id || isToggling === drink.id}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(drink.id)}
                      title="Delete"
                      disabled={isDeleting === drink.id || isToggling === drink.id}
                      >
                      {isDeleting === drink.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

       {/* No Results Message */}
      {!isLoading && !error && displayedDrinks.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          <p>No matching drinks found.</p>
          {searchTerm && <p>Try adjusting your search or filters.</p>}
          {!searchTerm && filterType !== 'all' && <p>Try selecting &apos;All Types&apos;.</p>}
          {!searchTerm && filterType === 'all' && <p>Add your first drink log using the &apos;Add Drink&apos; button!</p>}
        </div>
      )}

      {/* Load More Button */}
       {!isLoading && hasMore && displayedDrinks.length > 0 && (
         <div className="flex justify-center mt-6">
           <Button
             onClick={() => fetchDrinksData(true)}
             disabled={isLoadingMore}
             variant="outline"
           >
             {isLoadingMore ? (
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
             ) : null}
             Load More
           </Button>
         </div>
       )}
       {isLoadingMore && (
            <div className="flex justify-center mt-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        )}


        {/* Edit Drink Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Drink Log</DialogTitle>
                    <DialogDescription>
                        Update the details for this drink log.
                    </DialogDescription>
                </DialogHeader>
                {editingDrink && (
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Dassai 23" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="brewery"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brewery / Distillery</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Asahi Shuzo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select drink type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="sake">Sake</SelectItem>
                                                <SelectItem value="whiskey">Whiskey</SelectItem>
                                                <SelectItem value="beer">Beer</SelectItem>
                                                <SelectItem value="wine">Wine</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="rating"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rating</FormLabel>
                                    <FormControl>
                                    <div className="flex space-x-1 items-center pt-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`cursor-pointer h-5 w-5 ${star <= field.value ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                                            onClick={() => field.onChange(star)}
                                        />
                                        ))}
                                        <span className="ml-2 text-xs text-muted-foreground">({field.value}/5)</span>
                                    </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="comments"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Comments</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Tasting notes, occasion, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={editForm.control}
                                name="isPublic"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                                    <div className="space-y-0.5">
                                        <FormLabel>Public Log</FormLabel>
                                        <FormDescription>
                                            Make this drink log visible to others.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                         <Button
                                            type="button"
                                            role="switch"
                                            aria-checked={field.value}
                                            variant={field.value ? 'default' : 'outline'}
                                            onClick={() => field.onChange(!field.value)}
                                            className="w-[80px] shrink-0" // Fixed width button for toggle
                                            >
                                            {field.value ? 'Public' : 'Private'}
                                        </Button>
                                    </FormControl>
                                </FormItem>
                                )}
                            />

                            <DialogFooter>
                                 <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={editForm.formState.isSubmitting}>Cancel</Button>
                                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                                    {editForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>


    </div>
  );
}
