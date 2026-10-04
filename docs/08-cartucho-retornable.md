# 08 · Cartucho retornable

## La idea

El repuesto no va en un sobre (la cera es sólida y no se "vacía"). Va en un **cartucho de aluminio**: una copita de ~5.8 cm que cabe en el vaso de 6 cm, con la cera y la mecha ya puestas.

## El ciclo

1. El cliente **mete el cartucho completo al vaso** y lo prende. La cera arde dentro del aluminio, como una vela tealight en su portavelas.
2. **El vaso nunca se ensucia.** Se puede usar como vaso de agua en cualquier momento.
3. Cuando se acaba, el cliente **regresa el cartucho vacío a la tienda** y le descuentan un **depósito** (por ejemplo, $5), igual que con el refresco retornable.
4. La tienda junta los vacíos en una **caja de 24**. La ruta del distribuidor se los lleva de regreso en la misma visita semanal, sin costo extra de flete.
5. En planta **no se lava**: se calienta para derretir el residuo, se saca el cabo de mecha viejo, se pone mecha nueva y se rellena. El residuo se vuelve parte de la cera nueva; no se pierde un gramo.
6. Cuando un cartucho ya no sirve, se recicla (el aluminio se recicla sin límite).

## Por qué es mejor

- Cada cartucho da muchas vueltas antes de reciclarse.
- "100% reciclable" es literal: vaso de vidrio, cartucho y base de aluminio.
- El depósito hace que el cliente vuelva **a la misma tienda**.
- Menos vidrio en ruta → más piezas por tarima, menos rotura.
- El vaso limpio cumple la promesa de "se queda en tu casa como vaso".

## Lo que hay que validar

- Calibrar la mecha para el diámetro del cartucho.
- Que el borde de aluminio se vea bien dentro del vaso (manga o vaso esmerilado abajo).
- Cuántas vueltas aguanta un cartucho antes de deformarse.
- Tasa real de retorno por tienda.
- Costo del cartucho por millar (troquel) y costo de reproceso por vuelta.

## Impacto en el modelo

Para actualizar en el Excel:

- **Entra:** depósito (pasivo que se devuelve), costo del cartucho ÷ vueltas, reproceso (calentar, sacar cabo, mecha nueva), logística inversa.
- **Sale:** funda del repuesto y parte del empaque.
- **Indicadores nuevos:** cartuchos en circulación, en tienda, en ruta y en planta; tasa de retorno por distribuidor y tienda; vueltas promedio; bajas a reciclaje; saldo de depósitos.
