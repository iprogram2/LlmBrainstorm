// Gamification JavaScript functionality
$(document).ready(function() {
    // Initialize variables
    let points = 0;
    let energy = 0;
    const earnedBadges = [];
    let isPaused = false;
    
    // Initialize gamification elements
    initializeGameElements();
    
    // Make conversation settings collapsible
    $('.collapsible-header').on('click', function() {
        $(this).toggleClass('collapsed');
        $(this).next('.collapsible-content').toggleClass('collapsed');
    });

    // Theme toggle
    $('#theme-toggle').on('change', function() {
        if($(this).is(':checked')) {
            $('body').addClass('dark-mode');
        } else {
            $('body').removeClass('dark-mode');
        }
    });

    // Theme selector
    $('.theme-option').on('click', function() {
        $('.theme-option').removeClass('active');
        $(this).addClass('active');
        
        // Award points for customization
        updatePoints(5);
    });

    // Challenge mode selector
    $('.challenge-mode').on('click', function() {
        $('.challenge-mode').removeClass('active');
        $(this).addClass('active');
        
        // Award points for customization
        updatePoints(10);
    });

    // Make response cards draggable
    initializeDraggableCards();
    
    // Final button click
    $('#final-btn').on('click', function() {
        createConfetti();
        $(this).addClass('bounce-animation');
        
        // Award points for completion
        updatePoints(100);
        
        // Award completion badge if not already earned
        if (!earnedBadges.includes('completion')) {
            awardBadge('completion', 'fa-trophy', 'Brainstorm Complete');
        }
        
        setTimeout(() => {
            $(this).removeClass('bounce-animation');
        }, 500);
    });

    // Next round button click
    $('#next-round-btn').on('click', function() {
        // Award points for advancing
        updatePoints(75);
        
        // Update progress markers
        updateProgressMarkers();
        
        // Show round completion banner
        showRoundCompletionBanner();
        
        // Award multi-round badge if not already earned
        if (!earnedBadges.includes('multi-round')) {
            awardBadge('multi-round', 'fa-sync-alt', 'Multi-round Master');
        }
    });

    // Pause button click
    $('#pause-btn').on('click', function() {
        togglePause();
    });

    // Initialize human interjection
    initializeHumanInterjection();
    
    // LLM checkbox change
    $('.llm-checkbox').on('change', function() {
        // Count selected LLMs
        const selectedLlms = $('.llm-checkbox:checked').length;
        
        // Award badge if 3 or more LLMs are selected and badge not already earned
        if (selectedLlms >= 3 && !earnedBadges.includes('diverse')) {
            awardBadge('diverse', 'fa-lightbulb', 'Diverse Thinker');
            updatePoints(50);
        }
        
        // Update conversation state
        updateConversationState();
    });
    
    // Initialize functions
    
    function initializeGameElements() {
        // Create gamification header if it doesn't exist
        if ($('.gamification-header').length === 0) {
            const gamificationHeader = `
                <div class="card mb-4 gamification-header">
                    <div class="card-body d-flex justify-content-between align-items-center">
                        <div class="points-container">
                            <div class="points-display">
                                <i class="fas fa-star text-warning me-2"></i> Points: <span class="points-value">0</span>
                            </div>
                            <div class="d-flex justify-content-between small text-muted">
                                <span>Brainstorm Energy</span>
                                <span>0%</span>
                            </div>
                            <div class="energy-meter">
                                <div class="energy-fill" style="width: 0%;"></div>
                            </div>
                        </div>
                        <div class="badge-container">
                            <!-- Badges will appear here as they are earned -->
                        </div>
                    </div>
                </div>
            `;
            
            // Insert after the main heading
            $('h1.mt-4.mb-4').after(gamificationHeader);
        }
        
        // Create conversation state visualization if it doesn't exist
        if ($('.conversation-state').length === 0) {
            const conversationState = `
                <div class="conversation-state">
                    <!-- LLM status indicators will appear here -->
                </div>
            `;
            
            // Insert at the top of the response area
            $('#response-area').before(conversationState);
        }
        
        // Create progress path if it doesn't exist
        if ($('.progress-path').length === 0) {
            const progressPath = `
                <div class="progress-path mt-2 mb-0" style="width: 200px;">
                    <!-- Progress markers will be added dynamically -->
                </div>
            `;
            
            // Insert after the round indicator
            $('#round-indicator').after(progressPath);
            
            // Initialize progress markers
            updateProgressMarkers(true);
        }
        
        // Create human interjection elements if they don't exist
        if ($('.human-interjection-fab').length === 0) {
            const humanInterjectionFab = `
                <div class="human-interjection-fab" id="interjection-fab">
                    <i class="fas fa-comment-alt"></i>
                </div>
            `;
            
            const humanInterjectionModal = `
                <div class="human-interjection-modal" id="interjection-modal">
                    <div class="human-interjection-content">
                        <div class="human-interjection-close" id="interjection-close">
                            <i class="fas fa-times"></i>
                        </div>
                        <div class="human-interjection-header">
                            <h5 class="mb-0">Human Interjection</h5>
                            <p class="text-muted small mb-0">Add your thoughts to guide the conversation</p>
                        </div>
                        <div class="human-interjection-body">
                            <div class="form-group">
                                <label for="interjection-input" class="form-label">Your guidance or comment:</label>
                                <textarea class="form-control" id="interjection-input" rows="3" placeholder="Consider focusing on social media integration to reach younger customers..."></textarea>
                            </div>
                        </div>
                        <div class="human-interjection-footer">
                            <button class="btn btn-secondary" id="interjection-cancel">Cancel</button>
                            <button class="btn btn-primary" id="interjection-submit">Inject into conversation</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Append to the body
            $('body').append(humanInterjectionFab);
            $('body').append(humanInterjectionModal);
        }
        
        // Create round completion banner if it doesn't exist
        if ($('.round-completion-banner').length === 0) {
            const roundCompletionBanner = `
                <div class="round-completion-banner">
                    <i class="fas fa-check-circle me-2"></i> Round <span class="completed-round-number">1</span> Complete! +75 points
                </div>
            `;
            
            // Append to the body
            $('body').append(roundCompletionBanner);
        }
        
        // Create pause overlay if it doesn't exist
        if ($('.pause-overlay').length === 0) {
            const pauseOverlay = `
                <div class="pause-overlay">
                    <div>
                        <i class="fas fa-pause-circle"></i> Conversation Paused
                    </div>
                </div>
            `;
            
            // Append to the response area
            $('#response-area').append(pauseOverlay);
        }
        
        // Award first brainstorm badge
        setTimeout(() => {
            awardBadge('first-brainstorm', 'fa-brain', 'First Brainstorm');
        }, 1000);
        
        // Initialize conversation state
        updateConversationState();
    }
    
    function initializeDraggableCards() {
        // Make existing cards draggable
        $('.response-card').draggable({
            handle: '.card-handle',
            revert: 'invalid',
            zIndex: 100,
            start: function() {
                $(this).addClass('dragging');
            },
            stop: function() {
                $(this).removeClass('dragging');
                updatePoints(15);
            }
        });
        
        // Make response area droppable
        $('#response-area').droppable({
            accept: '.response-card',
            drop: function(event, ui) {
                const droppedCard = ui.draggable;
                const allCards = $('.response-card');
                const dropPosition = ui.offset.top;
                
                // Find the correct position for the card
                let insertBefore = null;
                allCards.each(function() {
                    if ($(this)[0] !== droppedCard[0]) {
                        const cardPosition = $(this).offset().top;
                        if (cardPosition > dropPosition) {
                            insertBefore = $(this);
                            return false;
                        }
                    }
                });
                
                // Reposition the card
                if (insertBefore) {
                    droppedCard.insertBefore(insertBefore);
                } else {
                    $('#response-area').append(droppedCard);
                }
                
                // Reset position
                droppedCard.css({top: 0, left: 0});
            }
        });
    }
    
    function initializeHumanInterjection() {
        // Human interjection FAB click
        $('#interjection-fab').on('click', function() {
            $('#interjection-modal').addClass('show');
            $(this).addClass('active');
        });

        // Human interjection close
        $('#interjection-close, #interjection-cancel').on('click', function() {
            $('#interjection-modal').removeClass('show');
            $('#interjection-fab').removeClass('active');
        });

        // Human interjection submit
        $('#interjection-submit').on('click', function() {
            if ($('#interjection-input').val().trim() !== '') {
                // Award points for participation
                updatePoints(25);
                
                // Add human response card
                const humanCard = `
                    <div class="response-card latest bounce-animation">
                        <div class="card-header">
                            <div class="llm-avatar" style="background-color: white; color: #6c757d;">
                                <i class="fas fa-user"></i>
                            </div>
                            <div>
                                <h6 class="mb-0">Human</h6>
                                <small class="text-muted">Just now</small>
                            </div>
                        </div>
                        <div class="card-content">
                            <p class="typing-animation">${$('#interjection-input').val()}</p>
                        </div>
                    </div>
                `;
                
                // Remove latest class from current latest
                $('.response-card.latest').removeClass('latest');
                
                // Add new card at the top
                $('#response-area').prepend(humanCard);
                
                // Make the new card draggable
                initializeDraggableCards();
                
                // Clear input and close modal
                $('#interjection-input').val('');
                $('#interjection-modal').removeClass('show');
                $('#interjection-fab').removeClass('active');
                
                // Resume conversation if paused
                if (isPaused) {
                    togglePause();
                }
                
                // Award collaboration badge if not already earned
                if (!earnedBadges.includes('collaboration')) {
                    awardBadge('collaboration', 'fa-crown', 'Collaboration King');
                }
                
                // Remove animation after a delay
                setTimeout(() => {
                    $('.response-card').first().removeClass('bounce-animation');
                }, 1000);
            }
        });
    }
    
    function updatePoints(amount) {
        points += amount;
        
        // Animate points increase
        $('.points-value').addClass('pulse-animation');
        setTimeout(() => {
            $('.points-value').text(points);
            $('.points-value').removeClass('pulse-animation');
        }, 500);
        
        // Update energy meter
        energy = Math.min(energy + amount / 20, 100);
        $('.energy-fill').css('width', energy + '%');
        $('.energy-fill').parent().next().find('span:last-child').text(Math.round(energy) + '%');
    }
    
    function awardBadge(id, icon, tooltip) {
        if (earnedBadges.includes(id)) return;
        
        earnedBadges.push(id);
        
        const badge = $(`<div class="achievement-badge earned bounce-animation"><i class="fas ${icon}"></i><span class="tooltip-text">${tooltip}</span></div>`);
        $('.badge-container').append(badge);
        
        // Award points for earning a badge
        updatePoints(50);
        
        setTimeout(() => {
            badge.removeClass('bounce-animation');
        }, 1000);
    }
    
    function updateProgressMarkers(initialize = false) {
        // Get current round and total rounds
        const currentRound = parseInt($('#round-indicator').text().split(' ')[1]);
        const totalRounds = parseInt($('#round-indicator').text().split(' ')[3]);
        
        if (initialize) {
            // Clear existing markers
            $('.progress-path').empty();
            
            // Add markers for each round
            for (let i = 1; i <= totalRounds; i++) {
                const position = (i - 1) / (totalRounds - 1) * 100;
                const isActive = i === currentRound;
                const isCompleted = i < currentRound;
                
                const markerClass = isActive ? 'active' : (isCompleted ? 'completed' : '');
                
                const marker = $(`<div class="progress-marker ${markerClass}" style="left: ${position}%;" title="Round ${i}"></div>`);
                $('.progress-path').append(marker);
            }
        } else {
            // Update round indicator
            if (currentRound < totalRounds) {
                $('#round-indicator').text(`Round ${currentRound + 1} of ${totalRounds}`);
                $('.completed-round-number').text(currentRound);
                
                // Update progress markers
                $('.progress-marker.active').addClass('completed').removeClass('active');
                $('.progress-marker:not(.completed):first').addClass('active');
            }
        }
    }
    
    function showRoundCompletionBanner() {
        $('.round-completion-banner').addClass('show');
        setTimeout(() => {
            $('.round-completion-banner').removeClass('show');
        }, 3000);
    }
    
    function togglePause() {
        isPaused = !isPaused;
        
        if (isPaused) {
            // Pause conversation
            $('#pause-btn').text('Resume');
            $('.pause-overlay').addClass('show');
        } else {
            // Resume conversation
            $('#pause-btn').text('Pause');
            $('.pause-overlay').removeClass('show');
            
            // Update conversation state
            updateConversationState();
        }
    }
    
    function updateConversationState() {
        // Clear existing state
        $('.conversation-state').empty();
        
        // Get selected LLMs
        const selectedLlms = [];
        $('.llm-checkbox:checked').each(function() {
            selectedLlms.push($(this).data('llm'));
        });
        
        // Define state icons
        const stateIcons = {
            'responded': '<i class="fas fa-check-circle"></i>',
            'thinking': '<i class="fas fa-spinner fa-spin"></i>',
            'waiting': '<i class="fas fa-clock"></i>'
        };
        
        // Create status indicators for each LLM
        selectedLlms.forEach((llm, index) => {
            // For demo purposes, assign states based on index
            // In real implementation, this would be based on actual LLM state
            let state;
            if (index === 0) {
                state = 'responded';
            } else if (index === 1) {
                state = 'thinking';
            } else {
                state = 'waiting';
            }
            
            const thinkingDots = state === 'thinking' ? '<span class="thinking-dots"></span>' : '';
            
            const statusElement = $(`
                <div class="llm-status ${llm.toLowerCase()} ${state}">
                    ${stateIcons[state]} ${llm} ${thinkingDots}
                </div>
            `);
            
            $('.conversation-state').append(statusElement);
        });
    }
    
    function createConfetti() {
        for (let i = 0; i < 50; i++) {
            const confetti = $('<div class="confetti"></div>');
            confetti.css({
                'left': Math.random() * 100 + '%',
                'background-color': getRandomColor()
            });
            
            $('body').append(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }
    }
    
    function getRandomColor() {
        const colors = ['#4e73df', '#1cc88a', '#f6c23e', '#e74a3b', '#36b9cc'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Add response handler to add typing animation and latest style
    window.addResponse = function(llm, content) {
        // Create avatar code based on LLM
        let avatarCode, avatarColor;
        switch(llm.toLowerCase()) {
            case 'chatgpt':
                avatarCode = 'GPT';
                avatarColor = 'var(--chatgpt-color)';
                break;
            case 'gemini':
                avatarCode = 'GEM';
                avatarColor = 'var(--gemini-color)';
                break;
            case 'claude':
                avatarCode = 'CLA';
                avatarColor = 'var(--claude-color)';
                break;
            case 'grok':
                avatarCode = 'GRK';
                avatarColor = 'var(--grok-color)';
                break;
            case 'llama':
                avatarCode = 'LLM';
                avatarColor = 'var(--llama-color)';
                break;
            case 'deepseek':
                avatarCode = 'DSK';
                avatarColor = 'var(--deepseek-color)';
                break;
            default:
                avatarCode = llm.substring(0, 3).toUpperCase();
                avatarColor = 'var(--dark-color)';
        }
        
        // Remove latest class from current latest
        $('.response-card.latest').removeClass('latest');
        
        // Create new response card
        const responseCard = `
            <div class="response-card latest bounce-animation">
                <div class="card-header">
                    <div class="llm-avatar" style="background-color: white; color: ${avatarColor};">${avatarCode}</div>
                    <div>
                        <h6 class="mb-0">${llm}</h6>
                        <small class="text-muted">Just now</small>
                    </div>
                    <div class="card-handle ms-auto">
                        <i class="fas fa-grip-lines"></i>
                    </div>
                </div>
                <div class="card-content">
                    <p class="typing-animation">${content}</p>
                </div>
                <div class="card-footer">
                    <div class="card-rating">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-sm"><i class="fas fa-thumbs-up"></i></button>
                        <button class="btn btn-sm"><i class="fas fa-thumbs-down"></i></button>
                    </div>
                </div>
            </div>
        `;
        
        // Add new card at the top
        $('#response-area').prepend(responseCard);
        
        // Make the new card draggable
        initializeDraggableCards();
        
        // Update LLM status
        updateLlmStatus(llm, 'responded');
        
        // Remove animation after a delay
        setTimeout(() => {
            $('.response-card').first().removeClass('bounce-animation');
        }, 1000);
        
        // Award points for new response
        updatePoints(20);
        
        return true;
    };
    
    // Update LLM status in conversation state
    function updateLlmStatus(llm, newState) {
        const llmClass = llm.toLowerCase();
        const existingStatus = $(`.llm-status.${llmClass}`);
        
        if (existingStatus.length > 0) {
            // Remove old state classes
            existingStatus.removeClass('thinking waiting responded');
            
            // Add new state class
            existingStatus.addClass(newState);
            
            // Update icon
            const icon = existingStatus.find('i').first();
            icon.removeClass('fa-spinner fa-spin fa-clock fa-check-circle');
            
            switch(newState) {
                case 'thinking':
                    icon.addClass('fa-spinner fa-spin');
                    if (existingStatus.find('.thinking-dots').length === 0) {
                        existingStatus.append('<span class="thinking-dots"></span>');
                    }
                    break;
                case 'waiting':
                    icon.addClass('fa-clock');
                    existingStatus.find('.thinking-dots').remove();
                    break;
                case 'responded':
                    icon.addClass('fa-check-circle');
                    existingStatus.find('.thinking-dots').remove();
                    break;
            }
        }
    }
    
    // Set LLM to thinking state
    window.setLlmThinking = function(llm) {
        updateLlmStatus(llm, 'thinking');
        return true;
    };
    
    // Set LLM to waiting state
    window.setLlmWaiting = function(llm) {
        updateLlmStatus(llm, 'waiting');
        return true;
    };
});
