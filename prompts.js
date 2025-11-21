// prompts.js
// Lista de prompts predefinidos. 
// 'title': Lo que se ve en la lista.
// 'text': Lo que se escribe en la caja de texto.

var PREDEFINED_PROMPTS = [
    { 
        title: "Seleccionar Prompt..", 
        text: "" 
    },
    { 
        title: "Tratamiento de Senal", 
        text: "Sos un experto en transformadas de fourier, signals electricas (analogicas y digitales), matematica aplicada. Necesito que resuelvas  profundizando y razonando bien los ejercicios siguientes, pero respondiendo de forma concisa, corta y clara, despues si queres dar una breve explicacion, hazlo debajo de la respuesta corta. El ejercicio es:" 
    },
    { 
        title: "Programacion C/C++", 
        text: "Podes desarrollar el codigo en C, únicamente incluyendo en el codigo: 1. La libreria iostream (salvo caso indispensable de usar otra/s). 2. Variables lejibles y humanas. 3. cout, cin (using namespace std), int, float (no setear precision), no usar funciones (salvo si es indispensablemente necesario). 4. Sin comentarios, ni tampoco descripciones largas. El ejercicio es:"
    },
//    { 
//        title: "🇬🇧 Traducir a Inglés", 
//        text: "Traduce todo el texto visible en la imagen al inglés." 
//    },
//    { 
//        title: "📊 Analizar Datos", 
//        text: "Analiza los datos o tablas que ves en la imagen y extrae conclusiones principales." 
//    },
//    { 
//        title: "🧐 Detectar Errores", 
//        text: "Revisa el texto o contenido de la imagen en busca de errores ortográficos o lógicos." 
//    }
];