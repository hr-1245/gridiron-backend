const subscriptionTemplate = (email: string, planType: string, endDate: Date, discountApplied?: { percentage: number, name: string }): string => `<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome to AI Player Conversion</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }

        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            text-align: center;
        }

        .header {
            background-color: #007BFF;
            color: #ffffff;
            padding: 15px;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }

        .content {
            border: 3px solid #007BFF;
            padding: 0 2rem 1rem 2rem;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
        }

        .ai-feature {
            background-color: #E8F0FE;
            color: #333333;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        
        .highlight {
            font-weight: bold;
            color: #007BFF;
            font-size: 22px;
        }
        
        .discount-badge {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 14px;
            margin-top: 10px;
        }

        p {
            color: #333333;
        }
        
        .checkmark {
            color: #28a745;
            font-size: 18px;
        }
        
        .valid-info {
            font-size: 14px;
            color: #666;
            margin-top: 20px;
        }
    </style>

</head>

<body>
    <div class="container">
        <div class="header">
            <h2>You're All Set! 🏈🤖</h2>
        </div>
        <div class="content">
            <p style="margin-top:0px; padding-top:1rem">Congratulations, <strong>${email}</strong>!</p>
            
            ${discountApplied ? `<span class="discount-badge">🏷️ ${discountApplied.name || `${discountApplied.percentage}% Discount`} Applied!</span>` : ''}
            
            <div class="ai-feature">
                <p class="highlight">Unlimited Player Conversion Now Available!</p>
                <p><span class="checkmark">✓</span> Transform stats into insights instantly</p>
                <p><span class="checkmark">✓</span> Generate pro-level scouting reports</p>
                <p><span class="checkmark">✓</span> And many more premium features!</p>
            </div>
            
            <p>Start exploring your new AI tools and take your game to the next level.</p>
            <p class="valid-info">Valid until ${endDate.toLocaleDateString()}</p>
            <p>Go Grid-Iron! 🏈</p>
        </div>
    </div>
</body>

</html>`;

export default subscriptionTemplate;