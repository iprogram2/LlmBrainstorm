// Round completion modal functionality
function showRoundCompletionModal(roundNumber) {
    // Update the round number in the modal
    $('#completed-round-number').text(roundNumber);
    
    // Show the modal
    $('#round-completion-modal').addClass('show');
    
    // Add blinking effect to the next round button
    $('#next-round-btn').addClass('blinking-button');
    
    // Hide the modal after 3 seconds
    setTimeout(function() {
        $('#round-completion-modal').removeClass('show');
    }, 3000);
}

// DO NOT define typewriterEffect here - use the one from improved-typewriter.js

// Sequential LLM processing
function processLLMsSequentially(activeLLMs, prompt, round) {
    console.log(`Processing LLMs sequentially: ${activeLLMs.length} LLMs, round: ${round}`);
    
    return new Promise((resolve) => {
        const processNextLLM = (index) => {
            if (index >= activeLLMs.length) {
                console.log("All LLMs processed sequentially");
                resolve();
                return;
            }
            
            const llm = activeLLMs[index];
            console.log(`Processing ${llm} (${index + 1}/${activeLLMs.length})`);
            
            // Show thinking indicator for this LLM
            updateLLMStatus(llm, 'thinking');
            
            // Make API call for this LLM
            callLLMApi(llm, prompt, round)
                .then(response => {
                    console.log(`Received response from ${llm} with length: ${response.length}`);
                    
                    // Update status to completed
                    updateLLMStatus(llm, 'completed');
                    
                    // Create response element
                    const responseElement = createResponseElement(llm, response);
                    
                    // Add the latest class to the new response
                    responseElement.addClass('latest');
                    
                    // Remove latest class from any existing responses
                    $('.response-card.latest').removeClass('latest');
                    
                    // Get the response text element
                    const textElement = responseElement.find('.card-content p');
                    
                    console.log(`Applying typewriter effect to ${llm} response with length: ${response.length}`);
                    
                    // Apply typewriter effect to the text - use the global function from improved-typewriter.js
                    if (window.typewriterEffect) {
                        console.log("Using global typewriterEffect function");
                        window.typewriterEffect(textElement, response);
                    } else {
                        console.error("Global typewriterEffect function not found!");
                    }
                    
                    // Prepend to response area (newest on top)
                    $('#response-area').prepend(responseElement);
                    
                    // Process next LLM
                    setTimeout(() => processNextLLM(index + 1), 500);
                })
                .catch(error => {
                    console.error(`Error with ${llm}:`, error);
                    updateLLMStatus(llm, 'error');
                    setTimeout(() => processNextLLM(index + 1), 500);
                });
        };
        
        // Start processing with the first LLM
        processNextLLM(0);
    });
}

// Update LLM status in the conversation state visualization
// Only define if not already defined by direct-fixes.js
if (!window.updateLLMStatusDefined) {
    console.log("Setting updateLLMStatusDefined flag");
    window.updateLLMStatusDefined = true;
    
    window.updateLLMStatus = function(llm, status) {
        console.log(`Updating status for ${llm} to ${status} from round-completion.js`);
        
        const statusElement = $(`.llm-status[data-llm="${llm}"]`);
        
        if (statusElement.length === 0) {
            console.warn(`Status element for ${llm} not found`);
            return;
        }
        
        // Remove all status classes
        statusElement.removeClass('thinking completed waiting error');
        
        // Add appropriate class and update icon
        switch(status) {
            case 'thinking':
                statusElement.addClass('thinking');
                statusElement.find('.status-text').html('<i class="fas fa-spinner fa-spin"></i> Thinking...');
                break;
            case 'completed':
                statusElement.addClass('completed');
                statusElement.find('.status-text').html('<i class="fas fa-check-circle"></i> Completed');
                break;
            case 'waiting':
                statusElement.addClass('waiting');
                statusElement.find('.status-text').html('<i class="fas fa-clock"></i> Waiting');
                break;
            case 'error':
                statusElement.addClass('error');
                statusElement.find('.status-text').html('<i class="fas fa-exclamation-circle"></i> Error');
                break;
        }
    };
}

// Fix for round completion modal timing
function fixRoundCompletionTiming() {
    // Only override if not already done
    if (!window.roundCompletionFixed) {
        console.log("Setting roundCompletionFixed flag");
        window.roundCompletionFixed = true;
        
        // Store original functions for later use
        const originalHandleRoundCompletion = window.handleRoundCompletion;
        
        // Override the round completion handler to show the modal
        window.handleRoundCompletion = function(round) {
            console.log(`Handling round completion for round: ${round}`);
            
            // Show round completion modal first
            showRoundCompletionModal(round);
            
            // Call original handler after a delay
            setTimeout(() => {
                if (originalHandleRoundCompletion) {
                    originalHandleRoundCompletion(round);
                }
            }, 3100); // Wait until after modal disappears
        };
        
        // Override the next round button click handler
        $(document).on('click', '#next-round-btn', function() {
            console.log("Next round button clicked");
            // Remove blinking effect
            $(this).removeClass('blinking-button');
        });
    }
}

// Integrate with existing code
$(document).ready(function() {
    console.log("Initializing round-completion.js");
    
    // Only override if not already done
    if (!window.processResponsesOverridden) {
        console.log("Setting processResponsesOverridden flag");
        window.processResponsesOverridden = true;
        
        // Store original functions for later use
        const originalProcessResponses = window.processResponses;
        
        // Override the process responses function to use sequential processing
        window.processResponses = function(prompt, round) {
            console.log(`Processing responses for round: ${round}`);
            
            const activeLLMs = getActiveLLMs();
            console.log(`Active LLMs: ${activeLLMs.join(', ')}`);
            
            if (round === 1) {
                console.log("Using sequential processing for first round");
                // Use sequential processing for first round
                return processLLMsSequentially(activeLLMs, prompt, round);
            } else {
                console.log("Using original parallel processing for other rounds");
                // Use original parallel processing for other rounds
                return originalProcessResponses(prompt, round);
            }
        };
    }
    
    // Fix round completion modal timing
    fixRoundCompletionTiming();
});
