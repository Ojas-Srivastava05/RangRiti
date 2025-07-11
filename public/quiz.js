/********************
* Quiz Data - Indian Art & Culture *
********************/

const quiz = [
    {
        q: 'Which traditional Indian painting style originated in Bihar and is known for its vibrant colors and intricate patterns?',
        opts: ['Madhubani', 'Warli', 'Pattachitra', 'Tanjore'],
        ans: 0
    },
    {
        q: 'What is the classical dance form that originated in Kerala and is known for its elaborate costumes and makeup?',
        opts: ['Bharatanatyam', 'Kathakali', 'Odissi', 'Manipuri'],
        ans: 1
    },
    {
        q: 'Which ancient Indian scripture is considered the foundation of Indian classical music?',
        opts: ['Ramayana', 'Mahabharata', 'Sama Veda', 'Atharva Veda'],
        ans: 2
    },
    {
        q: 'The art of carpet weaving in Kashmir is influenced by which cultural tradition?',
        opts: ['Mughal', 'British', 'Portuguese', 'French'],
        ans: 0
    },
    {
        q: 'Which UNESCO World Heritage Site in India is famous for its erotic sculptures?',
        opts: ['Konark Sun Temple', 'Khajuraho', 'Hampi', 'Ellora Caves'],
        ans: 1
    },
    {
        q: 'What is the traditional folk art form of Maharashtra that uses simple geometric patterns?',
        opts: ['Madhubani', 'Warli', 'Gond', 'Pithora'],
        ans: 1
    },
    {
        q: 'Which metal is primarily used in the traditional craft of Dhokra?',
        opts: ['Gold', 'Silver', 'Bronze', 'Copper'],
        ans: 2
    },
    {
        q: 'The Raga system in Indian classical music is based on how many basic notes?',
        opts: ['5', '7', '12', '22'],
        ans: 1
    },
    {
        q: 'Which city is famous for its traditional Bandhani tie-dye technique?',
        opts: ['Jaipur', 'Ahmedabad', 'Jodhpur', 'Udaipur'],
        ans: 1
    },
    {
        q: 'The Ajanta and Ellora caves are famous for which type of art?',
        opts: ['Sculpture only', 'Painting only', 'Both sculpture and painting', 'Architecture only'],
        ans: 2
    }
];

let current = 0;
const statuses = Array(quiz.length).fill('NV'); // Not Visited, Not Answered, Answered
const userAnswers = Array(quiz.length).fill(null);
let submitted = false;

const $questionText = document.getElementById('question-text');
const $options = document.getElementById('options');
const $grid = document.getElementById('grid');
const $submit = document.getElementById('submit');

/********************
* Particle Animation *
********************/
const particleColors = [
    '#800000', '#680404', '#3B3B98', '#2C2C80', '#B22222', 
    '#228B22', '#FF9933', '#FF6F00', '#FFD700', '#F9A602'
];

function createParticle() {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.animationDuration = Math.random() * 15 + 10 + 's';
    const randomColor = particleColors[Math.floor(Math.random() * particleColors.length)];
    particle.style.background = randomColor;
    document.querySelector('.particles').appendChild(particle);
    
    particle.addEventListener('animationend', () => {
        particle.remove();
    });
}

setInterval(createParticle, 300);

/********************
* DOM Build *
********************/

function buildGrid() {
    $grid.innerHTML = '';
    quiz.forEach((_, idx) => {
        const btn = document.createElement('button');
        btn.textContent = `${idx+1}`;
        btn.addEventListener('click', () => goTo(idx));
        $grid.appendChild(btn);
    });
}

function loadQuestion(idx) {
    const item = quiz[idx];
    $questionText.textContent = item.q;
    $options.innerHTML = '';

    const urlParams = new URLSearchParams(window.location.search);
    const reviewMode = urlParams.get('review') === '1';

    item.opts.forEach((opt, i) => {
        const li = document.createElement('li');
        li.textContent = opt;

        if(userAnswers[idx] === i) {
            li.classList.add('selected');
            if (reviewMode) li.classList.add('review-mode');
        }

        if(reviewMode) {
            if(item.ans === i) li.classList.add('correct');
            else if(userAnswers[idx] === i && userAnswers[idx] !== item.ans) li.classList.add('wrong');
            li.onclick = null;
        } else if(submitted) {
            if(item.ans === i) li.classList.add('correct');
            else if(userAnswers[idx] === i && userAnswers[idx] !== item.ans) li.classList.add('wrong');
            li.onclick = null;
        } else {
            li.onclick = () => selectOption(i);
        }

        $options.appendChild(li);
    });

    highlightGrid();

    if(reviewMode) {
        document.querySelector('.btn-row').style.display = 'none';
        document.querySelector('.nav-row').style.display = 'none';
    } else {
        $submit.style.display = (current === quiz.length - 1 && !submitted) ? 'inline-block' : 'none';
        document.querySelector('.btn-row').style.display = '';
        document.querySelector('.nav-row').style.display = '';
    }
}



function highlightGrid() {
    [...$grid.children].forEach((btn, i) => {
        btn.className = '';
        if(statuses[i] === 'NV') btn.style.background = '#C19A6B';
        if(statuses[i] === 'NA') btn.style.background = '#DC143C';
        if(statuses[i] === 'A') btn.style.background = '#50C878';
        btn.style.outline = (i === current) ? '2px solid #FFD700' : '';
        btn.style.transform = (i === current) ? 'scale(1.1)' : '';
    });
}

/********************
* Actions *
********************/

function selectOption(optIdx) {
    userAnswers[current] = optIdx;
    statuses[current] = 'A';
    loadQuestion(current);
    
    // Add selection feedback
    const selectedOption = document.querySelector('.options-list li.selected');
    if (selectedOption) {
        selectedOption.style.transform = 'scale(1.02)';
        setTimeout(() => {
            selectedOption.style.transform = '';
        }, 200);
    }
}

function saveAndNext() {
    if(statuses[current] === 'NV') statuses[current] = userAnswers[current] !== null ? 'A' : 'NA';
    next();
}

function next() {
    if(current < quiz.length - 1) {
        current++;
        loadQuestion(current);
    }
}

function goTo(idx) {
    current = idx;
    loadQuestion(current);
}

function clearSelection() {
    userAnswers[current] = null;
    statuses[current] = 'NA';
    loadQuestion(current);
}

function submitQuiz() {
    submitted = true;
    loadQuestion(current);
    localStorage.setItem('quizResult', JSON.stringify({
        quiz: quiz,
        userAnswers: userAnswers
    }));
    window.location.href = 'result.html';
}

/********************
* Event Links *
********************/
document.getElementById('save-next').onclick = saveAndNext;
document.getElementById('clear').onclick = clearSelection;
document.getElementById('next').onclick = next;
document.getElementById('back').onclick = () => {
    if(current > 0) {
        current--;
        loadQuestion(current);
    }
};
document.getElementById('submit').onclick = submitQuiz;

/********************
* Init *
********************/
buildGrid();
loadQuestion(0);

// If coming from result page, jump to the requested question and show review mode
const reviewQ = localStorage.getItem('reviewQuestion');
const urlParams = new URLSearchParams(window.location.search);
if(urlParams.get('review') === '1' && reviewQ !== null) {
    current = parseInt(reviewQ, 10);
    loadQuestion(current);
    localStorage.removeItem('reviewQuestion');
}
