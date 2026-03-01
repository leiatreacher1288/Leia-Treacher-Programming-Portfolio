# ExamVault Exam Creation Guide

This comprehensive guide walks through the complete exam creation process in ExamVault, from initial setup to variant generation and integrity analysis.

## 📋 Table of Contents

- [Exam Creation Wizard](#exam-creation-wizard)
- [Variant Generation System](#variant-generation-system)
- [Algorithm Details](#algorithm-details)
- [Exam Integrity Score](#exam-integrity-score)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🧙‍♂️ Exam Creation Wizard

### Step 1: Basic Exam Configuration

**Access Points:**
- Dashboard → Quick Actions → "+ Create Exam"
- Course Detail → Exams Tab → "Create Exam"

**Required Fields:**
- **Course Selection**: Choose from available courses (dropdown)
- **Exam Title**: Descriptive name for the exam
- **Exam Type**: Quiz, Midterm, Final, or Practice
- **Time Limit**: Duration in minutes
- **Weight**: Percentage of course grade (0-100%)

**Optional Fields:**
- **Description**: Additional exam details
- **Required to Pass**: Mark as mandatory for course completion

### Step 2: Question Configuration

**Difficulty Distribution:**
- **Easy Percentage**: Typically 30-40% for balanced exams
- **Medium Percentage**: Usually 40-50% for core concepts
- **Hard Percentage**: Generally 20-30% for advanced topics

**Variant Settings:**
- **Questions per Variant**: Number of questions in each exam version
- **Number of Variants**: How many different versions to generate (2-10 recommended)
- **Allow Reuse**: Whether questions can appear in multiple variants

### Step 3: Question Bank Selection

**Question Sources:**
- Import from existing question banks
- Select specific questions manually
- Auto-select based on difficulty criteria
- Filter by tags, subjects, or difficulty levels

## 🔄 Variant Generation System

ExamVault uses sophisticated algorithms to create multiple exam variants that maintain fairness while minimizing cheating opportunities.

### Generation Modes

#### **Reuse Mode** (`allow_reuse = true`)
- **Purpose**: Uses the same set of questions across all variants
- **Method**: Shuffles question order and answer choices
- **Best For**: Limited question pools or standardized testing
- **Integrity**: Relies on question/choice shuffling for security

#### **Unique Mode** (`allow_reuse = false`)
- **Purpose**: Uses different questions for each variant
- **Method**: Distributes questions fairly across variants while maintaining difficulty balance
- **Best For**: Large question pools with comprehensive coverage
- **Integrity**: Higher security through question diversity

### Section-Based Allocation

**Smart Distribution:**
```
For each section:
1. Calculate proportional question allocation
2. Maintain difficulty distribution within sections
3. Ensure fair representation across variants
4. Handle mandatory questions consistently
```

**Example Distribution:**
- Section A (Fundamentals): 40% of questions
- Section B (Applications): 35% of questions  
- Section C (Advanced): 25% of questions

## ⚙️ Algorithm Details

### Core Generation Process

#### 1. Question Selection Algorithm

**Reuse Mode Process:**
```python
# Create master question list
master_questions = mandatory_questions + selected_non_mandatory

# For each variant:
for variant in variants:
    shuffled_questions = shuffle(master_questions)
    create_variant_questions(variant, shuffled_questions)
```

**Unique Mode Process:**
```python
# Distribute questions across variants maintaining balance
used_questions = set()
for variant in variants:
    # Select unique questions per section allocation
    variant_questions = select_balanced_questions(
        section_allocation,
        difficulty_targets,
        exclude=used_questions
    )
    used_questions.update(variant_questions)
    create_variant_questions(variant, variant_questions)
```

#### 2. Choice Randomization Algorithm

**Round-Robin Shuffling:**
```python
def round_robin_shuffle_choices(variants, question):
    for i, variant in enumerate(variants):
        # Shift choices by variant index
        shift = i % len(question.choices)
        randomized_choices = question.choices[shift:] + question.choices[:shift]
        
        # Update correct answer mapping
        update_correct_answer_indices(variant, shift)
```

**Multi-Correct Answer Handling:**
- Supports both single and multiple correct answers
- Maintains answer relationships during shuffling
- Handles various input formats (letters, numbers, arrays)

#### 3. Difficulty Balance Maintenance

**Proportional Distribution:**
```python
def maintain_difficulty_balance(questions, target_distribution):
    difficulty_groups = group_by_difficulty(questions)
    
    for difficulty, target_percentage in target_distribution.items():
        target_count = round(total_questions * target_percentage / 100)
        selected = sample(difficulty_groups[difficulty], target_count)
        balanced_questions.extend(selected)
```

### Anti-Cheating Optimizations

#### **Question Order Randomization**
- Shuffles question sequence for each variant
- Prevents positional answer copying
- Maintains mandatory question distribution

#### **Choice Shuffling**
- Rotates answer choices systematically
- Ensures different correct answer patterns
- Handles complex multi-answer questions

#### **Variant Diversity**
- Maximizes differences between adjacent variants
- Considers seating arrangements (A-B-C pattern)
- Balances question difficulty across all variants

## 📊 Exam Integrity Score

The Exam Integrity Score (0-100%) measures how well your exam protects against cheating through answer copying, especially among students with adjacent variants.

### Calculation Methodology

#### **Goal**
Measure variant differences to answer: "How difficult would it be for students sitting next to each other to copy answers?"

#### **Analysis Components**

**1. Shared Questions in Same Position**
- Percentage of identical question IDs at the same index
- **Impact**: High percentage = easier copying
- **Weight**: High priority in score calculation

**2. Shared Correct Answers at Same Index**
- Percentage of same correct answers (e.g., both "A") at same position
- **Impact**: Even different questions with same answers enable copying
- **Weight**: Critical for integrity assessment

**3. Answer Pattern Similarity**
- Compares sequence of correct answers across variants
- **Example**: Variant A ['A', 'D', 'B'] vs Variant B ['A', 'D', 'C']
- **Impact**: Similar patterns facilitate systematic copying
- **Weight**: Moderate impact on overall score

**4. Choice Set Similarity**
- For multi-correct questions, compares sorted answer sets
- **Example**: Both variants have ["A", "C"] as correct at position 5
- **Impact**: Identical choice sets at same position = vulnerability
- **Weight**: High for multi-answer questions

**5. Difficulty Distribution Similarity**
- Compares difficulty progression between variants
- **Impact**: Similar difficulty patterns may aid collaboration
- **Weight**: Lower impact, secondary consideration

#### **Score Interpretation**

| Score Range | Assessment | Recommendation |
|-------------|------------|----------------|
| **90-100%** | **Excellent** | Very different variants, low cheating risk |
| **70-89%** | **Good** | Reasonably different, moderate protection |
| **50-69%** | **Fair** | Some similarity, consider improving generation |
| **Below 50%** | **Poor** | Variants too similar, high cheating risk |

#### **Calculation Process**

**For each pair of adjacent variants** (A-B, B-C, etc.):

1. **Calculate vulnerability metrics:**
   ```
   shared_questions_same_pos = count_shared_questions_at_same_index()
   shared_answers_same_pos = count_shared_correct_answers_at_same_index()
   answer_pattern_similarity = calculate_sequence_similarity()
   choice_set_similarity = calculate_choice_overlap()
   difficulty_similarity = calculate_difficulty_pattern_similarity()
   ```

2. **Apply weighted scoring:**
   ```
   vulnerability_score = (
       shared_questions_same_pos * 0.3 +
       shared_answers_same_pos * 0.4 +
       answer_pattern_similarity * 0.2 +
       choice_set_similarity * 0.1
   )
   ```

3. **Convert to integrity score:**
   ```
   integrity_score = 100 - vulnerability_score
   ```

4. **Average across all variant pairs:**
   ```
   final_integrity_score = average(all_pair_integrity_scores)
   ```

### Improving Integrity Scores

#### **Increase Number of Variants**
- More variants = greater diversity
- Recommended: 3-5 variants minimum
- Diminishing returns beyond 8-10 variants

#### **Expand Question Pool**
- Larger pools enable better unique mode generation
- Aim for 3-5x more questions than needed per variant
- Ensure balanced difficulty distribution in pool

#### **Enable Unique Mode**
- Use `allow_reuse = false` when possible
- Requires sufficient questions per difficulty level
- Provides maximum variant diversity

#### **Optimize Section Distribution**
- Balance questions across content areas
- Avoid over-concentration in single sections
- Maintain proportional difficulty within sections

## 📚 Best Practices

### Question Bank Preparation

#### **Quality Standards**
- Write clear, unambiguous questions
- Ensure consistent difficulty tagging
- Include diverse question formats
- Test questions before exam deployment

#### **Pool Size Guidelines**
- **Reuse Mode**: 1.5-2x target questions needed
- **Unique Mode**: 3-5x target questions per variant
- **Safety Buffer**: Additional 20% for flexibility

### Variant Configuration

#### **Optimal Settings**
- **Variants**: 3-5 for most exams
- **Questions per Variant**: 15-50 depending on time limit
- **Difficulty Mix**: 30% Easy, 50% Medium, 20% Hard
- **Time Allocation**: 1-2 minutes per question

#### **Security Considerations**
- Use unique mode for high-stakes exams
- Ensure adequate question pool depth
- Consider randomized seating if possible
- Monitor integrity scores during generation

### Testing and Validation

#### **Pre-Deployment Checks**
- Generate sample variants for review
- Verify difficulty balance across variants
- Check integrity scores meet minimum thresholds
- Test variant generation with question pools

#### **Quality Assurance**
- Review generated questions for accuracy
- Validate answer key correctness
- Confirm time limits are appropriate
- Test system performance with target load

## 🔧 Troubleshooting

### Common Issues

#### **"Insufficient Questions" Error**
**Cause**: Not enough questions in pool for unique mode generation

**Solutions:**
- Add more questions to question bank
- Reduce number of variants
- Switch to reuse mode temporarily
- Adjust difficulty distribution requirements

#### **Low Integrity Scores**
**Cause**: Variants are too similar for effective anti-cheating

**Solutions:**
- Increase number of variants
- Expand question pool size
- Enable unique mode if using reuse mode
- Review question distribution settings

#### **Unbalanced Difficulty Distribution**
**Cause**: Question pool lacks sufficient questions in target difficulty levels

**Solutions:**
- Add questions to underrepresented difficulty levels
- Adjust percentage targets to match available questions
- Use automatic balancing when possible
- Review question difficulty tags for accuracy

#### **Variant Generation Timeout**
**Cause**: System cannot find valid configuration within time limits

**Solutions:**
- Simplify section allocation requirements
- Reduce number of constraints
- Increase question pool size
- Contact system administrator for configuration review

### Performance Optimization

#### **Large Question Pools**
- Index questions by difficulty and section
- Use database query optimization
- Consider caching for frequently used pools
- Monitor generation time and adjust timeouts

#### **High Variant Counts**
- Limit maximum variants based on question pool size
- Use progressive generation for large sets
- Implement background processing for complex exams
- Provide progress feedback to users

## 🔗 Related Documentation

- [Testing Guide](../TESTING_GUIDE.md) - How to test exam generation
- [Troubleshooting Guide](../TROUBLESHOOTING_GUIDE.md) - Common issues and solutions
- [API Documentation](./README.md) - Exam API endpoints
- [Question Bank Management](../app/backend/questions/README.md) - Question management guide

## 🤝 Support

For additional help with exam creation:

1. **Check the [Troubleshooting Guide](../TROUBLESHOOTING_GUIDE.md)**
2. **Review [API Documentation](./README.md) for technical details**
3. **Consult question bank documentation for pool management**
4. **Contact system administrators for configuration issues**

---

*This guide covers the complete exam creation workflow in ExamVault, from basic setup through advanced variant generation and integrity analysis. For technical implementation details, refer to the codebase documentation and API guides.*
