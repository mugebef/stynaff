import React from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
  aspect?: number;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCropComplete, aspect = 1 }) => {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-black/20 ring-1 ring-white/10">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>
      <div className="flex items-center gap-4 px-2">
        <div className="flex items-center gap-2 flex-1">
          <ZoomOut size={16} className="text-neutral-500" />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-800 accent-orange-600 transition-all hover:accent-orange-500"
          />
          <ZoomIn size={16} className="text-neutral-500" />
        </div>
        <button
          type="button"
          onClick={() => setRotation((prev) => (prev + 90) % 360)}
          className="rounded-full bg-neutral-800 p-2 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-all"
        >
          <RotateCw size={18} />
        </button>
      </div>
    </div>
  );
};
