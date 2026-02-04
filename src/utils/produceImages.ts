// Utility to get produce images based on commodity type
import maizeCobImg from '@/assets/original maize cob.jpg';
import maizeFarmImg from '@/assets/maize farm nigeria.jpg';
import cassavaImg from '@/assets/cassava tubers.jpg';
import riceImg from '@/assets/rice grains.jpg';
import yamImg from '@/assets/Yam-tubers.jpg';
import sorghumImg from '@/assets/soghurm grains.jpg';
import tomatoesImg from '@/assets/fresh tomatoes.jpg';
import pepperImg from '@/assets/fresh pepper.jpg';
import onionsImg from '@/assets/onions.jpg';
import agriculturalImg from '@/assets/agricultural farm produce.jpg';

// Map commodity types to their corresponding images
export const getProduceImage = (commodity: string): string => {
  const commodityLower = commodity.toLowerCase();
  
  if (commodityLower.includes('maize') || commodityLower.includes('corn')) {
    return maizeCobImg;
  }
  if (commodityLower.includes('cassava')) {
    return cassavaImg;
  }
  if (commodityLower.includes('rice')) {
    return riceImg;
  }
  if (commodityLower.includes('yam')) {
    return yamImg;
  }
  if (commodityLower.includes('sorghum')) {
    return sorghumImg;
  }
  if (commodityLower.includes('tomato')) {
    return tomatoesImg;
  }
  if (commodityLower.includes('pepper')) {
    return pepperImg;
  }
  if (commodityLower.includes('onion')) {
    return onionsImg;
  }
  
  // Default fallback image
  return agriculturalImg;
};

// Get multiple images for a commodity (for listings with multiple photos)
export const getProduceImages = (commodity: string): string[] => {
  const mainImage = getProduceImage(commodity);
  const commodityLower = commodity.toLowerCase();
  
  // Return array with main image and additional related images if available
  const images = [mainImage];
  
  // Add secondary images based on commodity
  if (commodityLower.includes('maize') || commodityLower.includes('corn')) {
    if (maizeFarmImg && !images.includes(maizeFarmImg)) {
      images.push(maizeFarmImg);
    }
  }
  
  return images;
};















