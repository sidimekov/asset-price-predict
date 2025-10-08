'use client';

     import React, { useState } from 'react';

     export const Calculator = () => {
       const [a, setA] = useState(0);
       const [b, setB] = useState(0);
       const [result, setResult] = useState(0);

       const add = () => setResult(a + b);
       const subtract = () => setResult(a - b);
       const multiply = () => setResult(a * b);
       const divide = () => setResult(b !== 0 ? a / b : 'Error');

       return (
         <div className="p-4">
           <h1 className="text-2xl font-bold">Калькулятор</h1>
           <input
             type="number"
             value={a}
             onChange={(e) => setA(Number(e.target.value))}
             className="border p-2 m-2"
           />
           <input
             type="number"
             value={b}
             onChange={(e) => setB(Number(e.target.value))}
             className="border p-2 m-2"
           />
           <div>
             <button onClick={add} className="bg-blue-500 text-white p-2 m-2">Сложить</button>
             <button onClick={subtract} className="bg-blue-500 text-white p-2 m-2">Вычесть</button>
             <button onClick={multiply} className="bg-blue-500 text-white p-2 m-2">Умножить</button>
             <button onClick={divide} className="bg-blue-500 text-white p-2 m-2">Разделить</button>
           </div>
           <p className="text-lg">Результат: {result}</p>
         </div>
       );
     };
