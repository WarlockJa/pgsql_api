interface IGetEmailBody {
  h1: string;
  bodyText: string;
  href: string;
  aText: string;
}

const getEmailBody = (props: IGetEmailBody): string => {
  const { h1, bodyText, href, aText } = props;
  return (
    // creating html verification link to send user as email body
    `<body style="padding: 3em; border-radius: 8px; background: linear-gradient(35deg, lightblue, rgb(232, 255, 254)); color: #131313; font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;">
          <h1>${h1}</h1>
          <p style="max-width: 700px; font-size: 1.5rem;">${bodyText}</p>
          <a style="color: #2626B6; font-size: 1.5rem;" onmouseleave="this.style.color='#2626B6'" onmouseover="this.style.color='#7626B6'" href=${href} target='_blank'>${aText}</a>
      </body>`
  );
};

export default getEmailBody;
