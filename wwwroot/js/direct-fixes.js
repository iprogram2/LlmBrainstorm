// Direct implementation of conversation state visualization
$(document).ready(function() {
    console.log("Initializing direct-fixes.js");
    
    // Create conversation state container
    const stateContainer = $('<div class="conversation-state mb-3"></div>');
    $('#response-area').before(stateContainer);
    
    // Initialize LLM status indicators
    function initializeStatusIndicators() {
        // Clear existing indicators
        $('.conversation-state').empty();
        
        // Get active LLMs
        const activeLLMs = getActiveLLMs();
        console.log("Active LLMs:", activeLLMs);
        
        // Add status indicator for each active LLM
        activeLLMs.forEach(llm => {
            const color = getLLMColor(llm);
            const statusElement = $(`
                <div class="llm-status" data-llm="${llm}" style="display: inline-block; margin-right: 15px; padding: 5px 10px; border-radius: 5px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
                    <span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: ${color}; text-align: center; color: white; margin-right: 5px; font-weight: bold;">
                        ${llm.charAt(0)}
                    </span>
                    <span style="font-weight: bold;">${llm}</span>
                    <span class="status-text" style="margin-left: 5px; font-size: 0.9em;">
                        <i class="fas fa-clock"></i> Waiting
                    </span>
                </div>
            `);
            
            $('.conversation-state').append(statusElement);
        });
    }
    
    // Get color for LLM
    function getLLMColor(llm) {
        const colors = {
            'ChatGPT': '#10a37f',
            'Gemini': '#1a73e8',
            'Grok': '#ff6b6b',
            'Llama': '#8e44ad',
            'DeepSeek': '#3498db',
            'Claude': '#6366f1'
        };
        
        return colors[llm] || '#6c757d';
    }
    
    // Update LLM status
    window.updateLLMStatus = function(llm, status) {
        console.log(`Updating status for ${llm} to ${status}`);
        const statusElement = $(`.llm-status[data-llm="${llm}"] .status-text`);
        
        if (statusElement.length === 0) {
            console.warn(`Status element for ${llm} not found`);
            return;
        }
        
        // Update status text and icon
        switch(status) {
            case 'thinking':
                statusElement.html('<i class="fas fa-spinner fa-spin"></i> Thinking...');
                break;
            case 'completed':
                statusElement.html('<i class="fas fa-check-circle"></i> Completed');
                break;
            case 'waiting':
                statusElement.html('<i class="fas fa-clock"></i> Waiting');
                break;
            case 'error':
                statusElement.html('<i class="fas fa-exclamation-circle"></i> Error');
                break;
        }
    };
    
    // Override the original callLLMApi function
    const originalCallLLMApi = window.callLLMApi;
    window.callLLMApi = function(llm, prompt, round) {
        console.log(`Calling API for ${llm} with prompt length: ${prompt.length}, round: ${round}`);
        
        // Update status to thinking
        updateLLMStatus(llm, 'thinking');
        
        // Call original function
        return originalCallLLMApi(llm, prompt, round)
            .then(response => {
                console.log(`Received response from ${llm} with length: ${response.length}`);
                // Update status to completed
                updateLLMStatus(llm, 'completed');
                return response;
            })
            .catch(error => {
                console.error(`Error with ${llm}:`, error);
                // Update status to error
                updateLLMStatus(llm, 'error');
                throw error;
            });
    };
    
    // Initialize status indicators when LLMs are toggled
    $(document).on('change', '.llm-checkbox', function() {
        setTimeout(initializeStatusIndicators, 100);
    });
    
    // Initialize status indicators on page load
    setTimeout(initializeStatusIndicators, 500);
    
    // DO NOT define typewriterEffect here - use the one from improved-typewriter.js
    
    // Override the createResponseElement function to ensure proper response formatting
    // but only if it hasn't been overridden by improved-typewriter.js
    if (!window.createResponseElementOverridden) {
        console.log("Setting createResponseElementOverridden flag");
        window.createResponseElementOverridden = true;
        
        const originalCreateResponseElement = window.createResponseElement;
        if (originalCreateResponseElement) {
            console.log("Overriding createResponseElement from direct-fixes.js");
            window.createResponseElement = function(llm, response) {
                console.log(`Creating response element for ${llm} from direct-fixes.js`);
                
                // Create the response element using the original function
                const responseElement = originalCreateResponseElement(llm, response);
                
                // Find the text element
                const textElement = responseElement.find('.card-content p');
                
                // Clear the text element (the typewriter effect will fill it)
                textElement.empty();
                
                // Return the modified element
                return responseElement;
            };
        }
    }
});
