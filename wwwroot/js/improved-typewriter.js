// Improved character-by-character typewriter effect
function improvedTypewriterEffect(element, text, speed = 30) {
    console.log("Starting improved typewriter effect with text length: " + text.length);
    
    // Clear the element first
    element.empty();
    
    // Create a container for the typing effect
    const container = $('<div class="typewriter-container"></div>');
    element.append(container);
    
    // Add a blinking cursor
    const cursor = $('<span class="typewriter-cursor">|</span>');
    container.append(cursor);
    
    // Set up the typing animation
    let i = 0;
    
    // Function to add the next character
    function typeNextChar() {
        if (i < text.length) {
            // Get the next character
            const char = text.charAt(i);
            
            // Add the character before the cursor
            cursor.before(document.createTextNode(char));
            
            // Log progress periodically
            if (i % 20 === 0) {
                console.log(`Typing character ${i}/${text.length}`);
            }
            
            // Move to the next character
            i++;
            
            // Schedule the next character with consistent timing
            setTimeout(typeNextChar, speed);
        } else {
            console.log("Typewriter effect completed");
            // Typing is complete, remove the cursor
            setTimeout(() => {
                cursor.remove();
                // Add a class to indicate completion
                container.addClass('typing-complete');
            }, 500);
        }
    }
    
    // Start the typing animation
    typeNextChar();
}

// Override the createResponseElement function to use the improved typewriter effect
function overrideCreateResponseElement() {
    console.log("Overriding createResponseElement function");
    
    // Store the original function
    const originalCreateResponseElement = window.createResponseElement;
    
    // Override the function
    window.createResponseElement = function(llm, response) {
        console.log(`Creating response element for ${llm} with response length: ${response.length}`);
        
        // Create the response element using the original function
        const responseElement = originalCreateResponseElement(llm, response);
        
        // Find the response content element
        const contentElement = responseElement.find('.response-content');
        
        // Clear the content element and prepare it for the typewriter effect
        contentElement.empty();
        contentElement.addClass('typewriter-text');
        
        // Return the modified element
        return responseElement;
    };
    
    // Set flag to prevent double-overriding
    window.createResponseElementOverridden = true;
}

// Override the typewriterEffect function
function overrideTypewriterEffect() {
    console.log("Overriding global typewriterEffect function");
    
    // Replace the existing typewriterEffect function
    window.typewriterEffect = function(element, text, speed = 30) {
        console.log(`Applying typewriter effect to element with text length: ${text.length}`);
        return improvedTypewriterEffect(element, text, speed);
    };
}

// Apply the typewriter effect to existing responses
function applyTypewriterToExistingResponses() {
    console.log("Applying typewriter effect to existing responses");
    
    $('.response-card').each(function() {
        const contentElement = $(this).find('.response-content');
        const text = contentElement.text();
        
        if (text && !contentElement.hasClass('typewriter-text')) {
            console.log(`Applying typewriter effect to existing response with text length: ${text.length}`);
            contentElement.addClass('typewriter-text');
            improvedTypewriterEffect(contentElement, text);
        }
    });
}

// Add CSS for the typewriter effect
function addTypewriterCSS() {
    console.log("Adding typewriter CSS");
    
    const css = `
        .typewriter-container {
            display: inline;
            position: relative;
        }
        
        .typewriter-cursor {
            display: inline-block;
            width: 2px;
            background-color: currentColor;
            margin-left: 2px;
            animation: blink 0.7s infinite;
        }
        
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        
        .typewriter-text {
            white-space: pre-wrap;
            word-break: break-word;
        }
    `;
    
    // Remove existing CSS if it exists
    $('#improved-typewriter-css').remove();
    
    // Add the new CSS
    $('<style id="improved-typewriter-css">').text(css).appendTo('head');
}

// Initialize the improved typewriter effect
$(document).ready(function() {
    console.log("Initializing improved typewriter effect");
    
    // Add the CSS for the typewriter effect
    addTypewriterCSS();
    
    // Override the createResponseElement function if not already overridden
    if (!window.createResponseElementOverridden) {
        overrideCreateResponseElement();
    }
    
    // Override the typewriterEffect function
    overrideTypewriterEffect();
    
    // Apply the typewriter effect to existing responses
    setTimeout(applyTypewriterToExistingResponses, 1000);
});
