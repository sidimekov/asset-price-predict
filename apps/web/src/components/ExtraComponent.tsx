'use client';

   import React from 'react';

   export const ExtraComponent = () => {
     const generateRandom = () => Math.random() * 100;
     const formatNumber = (num: number) => num.toFixed(2);

     return (
       <div className="p-4">
         <h2 className="text-xl font-semibold">Случайное число</h2>
         <p className="text-lg">{formatNumber(generateRandom())}</p>
       </div>
     );
   };
