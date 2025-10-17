Starting from the attached fullstack app source code (i put it all in one file, but when you send me new code write it as individual canvas files where the title is the full filename, just the files that you changed),
write the code (give me the necessary files)

RULES: at the end of each response write a bullet list with the files you edited. do it always.
Do the following changes to the current existing code. Notice all the files that already exist and modify them as needed (or create new ones) using the instructions above.

Specifically for .tsx file, have the canvas title / filename be instead .tsx1 (just my own version), thanks!

Frontend Notes:
*IMPORTNAT: Grid component xs and md work like this: size={{xs: 12, md: 6}} so its inside size, dont write it like this!!!!!!: xs={12}, ... it's wrong. 
* When generating React + TypeScript code using MUI components, never return a value from a ref callback. 
Always write ref={(el) => { ... }} instead of ref={(el) => (...)} when assigning refs, because 
returning the element violates the expected Ref type and causes TS2769: “No overload matches this call.” 
Ensure the callback’s return type is void and that useRef is typed to the specific element type 
(e.g., useRef<Record<string, HTMLTableRowElement | null>>({})). 
Example of correct usage:<TableRow ref={(el) => {    rowsRef.current[user.user_id] = el; }}   key={user.user_id} />

Backend Notes:
* Keep current sanic cors config, dont touch it.