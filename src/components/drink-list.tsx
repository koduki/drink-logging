
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Star, MapPin, Clock, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import RadarChartComponent from './radar-chart'; // Assuming this exists
import { ScoreDrinkDetailsOutput } from '@/ai/flows/score-drink-details'; // Assuming this type exists


// Mock data - replace with actual data fetching
interface DrinkLog {
  id: string;
  name: string;
  brewery: string;
  type: 'sake' | 'whiskey' | 'beer' | 'wine';
  rating: number;
  comments?: string;
  photoUrl?: string;
  isPublic: boolean;
  location?: { latitude: number; longitude: number; };
  timestamp: Date;
  aiScore?: ScoreDrinkDetailsOutput | null;
}

const mockDrinks: DrinkLog[] = [
 {
    id: '1',
    name: 'Dassai 23',
    brewery: 'Asahi Shuzo',
    type: 'sake',
    rating: 5,
    comments: 'Smooth and elegant. Perfect for celebrations.',
    photoUrl: 'https://picsum.photos/seed/dassai23/200/200',
    isPublic: true,
    location: { latitude: 34.0522, longitude: -118.2437 },
    timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
    aiScore: {
      aroma: { score: 4, reason: "Delicate floral notes." },
      sweetness: { score: 3, reason: "Balanced sweetness." },
      richnessBody: { score: 4, reason: "Silky texture." },
      acidityFreshness: { score: 3, reason: "Moderate acidity." },
      complexity: { score: 5, reason: "Layered flavors." },
      aftertasteFinish: { score: 5, reason: "Clean and long finish." },
    },
  },
  {
    id: '2',
    name: 'Yamazaki 12 Year',
    brewery: 'Suntory',
    type: 'whiskey',
    rating: 4,
    comments: 'Complex oak and fruit notes. Enjoyed neat.',
    photoUrl: 'https://picsum.photos/seed/yamazaki12/200/200',
    isPublic: true,
    timestamp: new Date(Date.now() - 86400000 * 5), // 5 days ago
    aiScore: {
      aroma: { score: 5, reason: "Rich oak and dried fruit." },
      sweetness: { score: 2, reason: "Subtle honey notes." },
      richnessBody: { score: 4, reason: "Medium to full body." },
      acidityFreshness: { score: 1, reason: "Minimal acidity, expected for whiskey." },
      complexity: { score: 4, reason: "Good complexity." },
      aftertasteFinish: { score: 4, reason: "Warm and lingering finish." },
    },
  },
 {
    id: '3',
    name: 'Hitachino Nest White Ale',
    brewery: 'Kiuchi Brewery',
    type: 'beer',
    rating: 4,
    comments: 'Refreshing witbier with hints of coriander and orange peel.',
    photoUrl: 'https://picsum.photos/seed/hitachino/200/200',
    isPublic: false,
    location: { latitude: 35.6895, longitude: 139.6917 },
    timestamp: new Date(Date.now() - 86400000 * 1), // 1 day ago
     aiScore: null, // No AI score yet
  },
  {
    id: '4',
    name: 'Château Margaux 2015',
    brewery: 'Château Margaux',
    type: 'wine',
    rating: 5,
    comments: 'Exceptional Bordeaux. Deep, complex, long finish.',
    // No photo for this one
    isPublic: true,
    timestamp: new Date(Date.now() - 86400000 * 10), // 10 days ago
    aiScore: {
      aroma: { score: 5, reason: "Intense blackcurrant and cedar." },
      sweetness: { score: 1, reason: "Dry." },
      richnessBody: { score: 5, reason: "Full-bodied and structured." },
      acidityFreshness: { score: 4, reason: "Well-balanced acidity." },
      complexity: { score: 5, reason: "Highly complex layers." },
      aftertasteFinish: { score: 5, reason: "Extremely long and evolving finish." },
    },
  },
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function DrinkList() {
  const [drinks, setDrinks] = useState<DrinkLog[]>(mockDrinks);
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');
  const [filterType, setFilterType] = useState<'all' | 'sake' | 'whiskey' | 'beer' | 'wine'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSortChange = (value: 'date' | 'rating') => {
    setSortBy(value);
  };

 const handleFilterChange = (value: 'all' | 'sake' | 'whiskey' | 'beer' | 'wine') => {
    setFilterType(value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

   const handleDelete = (id: string) => {
     // Implement actual deletion logic here
     setDrinks(drinks.filter(drink => drink.id !== id));
     console.log(`Delete drink with id: ${id}`);
  };

  const handleEdit = (id: string) => {
      // Implement navigation or modal opening for editing
      console.log(`Edit drink with id: ${id}`);
  };

   const toggleVisibility = (id: string) => {
     setDrinks(drinks.map(drink =>
       drink.id === id ? { ...drink, isPublic: !drink.isPublic } : drink
     ));
      console.log(`Toggle visibility for drink id: ${id}`);
   };


  const filteredAndSortedDrinks = drinks
    .filter(drink => filterType === 'all' || drink.type === filterType)
    .filter(drink =>
      drink.name.toLowerCase().includes(searchTerm) ||
      drink.brewery.toLowerCase().includes(searchTerm) ||
      (drink.comments && drink.comments.toLowerCase().includes(searchTerm))
    )
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating; // Highest rating first
      }
      return b.timestamp.getTime() - a.timestamp.getTime(); // Newest first
    });

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-primary-foreground mb-6">My Drink Logs</h1>

       {/* Filters and Sorting */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search drinks..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <Select onValueChange={handleFilterChange} defaultValue="all">
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
        <Select onValueChange={handleSortChange} defaultValue="date">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date (Newest)</SelectItem>
            <SelectItem value="rating">Sort by Rating (Highest)</SelectItem>
          </SelectContent>
        </Select>
      </div>


      {/* Drink List Grid */}
      {filteredAndSortedDrinks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDrinks.map((drink) => (
            <Card key={drink.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                 {drink.photoUrl && (
                    <div className="relative aspect-video mb-4 rounded-t-lg overflow-hidden">
                        <Image src={drink.photoUrl} alt={drink.name} layout="fill" objectFit="cover" />
                    </div>
                    )}
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-semibold mb-1">{drink.name}</CardTitle>
                        <CardDescription>{drink.brewery}</CardDescription>
                    </div>
                     <Badge variant={drink.type === 'sake' ? 'default' : 'secondary'} className="capitalize">{drink.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                 <div className="flex items-center">
                   {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < drink.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                    />
                   ))}
                   <span className="ml-2 text-sm text-muted-foreground">({drink.rating}/5)</span>
                 </div>
                {drink.comments && <p className="text-sm text-muted-foreground italic">"{drink.comments}"</p>}

                 {drink.aiScore && (
                    <div className="mt-4 pt-4 border-t">
                       <h4 className="text-sm font-medium mb-2">AI Score Analysis</h4>
                       <RadarChartComponent scoreData={drink.aiScore} size={150}/>
                    </div>
                 )}


              </CardContent>
              <CardFooter className="flex flex-col items-start text-xs text-muted-foreground border-t pt-3 space-y-2">
                <div className="flex justify-between w-full items-center">
                    <div className="flex items-center gap-1">
                         <Clock className="h-3 w-3" />
                        <span>{drink.timestamp.toLocaleDateString()}</span>
                    </div>
                     {drink.location && (
                        <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Lat: {drink.location.latitude.toFixed(2)}, Lon: {drink.location.longitude.toFixed(2)}</span>
                        </div>
                    )}
                </div>
                <div className="flex justify-between w-full items-center pt-2">
                     <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => toggleVisibility(drink.id)} title={drink.isPublic ? "Make Private" : "Make Public"}>
                       {drink.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                       <span className="ml-1">{drink.isPublic ? 'Public' : 'Private'}</span>
                    </Button>
                     <div className="flex gap-1">
                         <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEdit(drink.id)} title="Edit">
                             <Edit className="h-4 w-4" />
                         </Button>
                         <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDelete(drink.id)} title="Delete">
                             <Trash2 className="h-4 w-4" />
                         </Button>
                     </div>
                </div>

              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-10">
          <p>No matching drinks found.</p>
          {searchTerm && <p>Try adjusting your search or filters.</p>}
           {!searchTerm && filterType === 'all' && <p>Add your first drink log!</p>}
        </div>
      )}
    </div>
  );
}
